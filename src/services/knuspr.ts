// In dev, requests are proxied via Vite to avoid CORS.
// In production, call the MCP server directly (requires CORS support on the server).
const MCP_ENDPOINT = import.meta.env.DEV
  ? '/knuspr-mcp/'
  : 'https://mcp.knuspr.de/mcp';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface McpToolResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

let sessionId: string | null = null;
let requestId = 0;

function nextId() {
  return ++requestId;
}

async function mcpRequest(
  message: JsonRpcRequest,
  email: string,
  password: string,
): Promise<JsonRpcResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'rhl-email': email,
    'rhl-pass': password,
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }

  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    throw new Error(`MCP request failed: ${res.status} ${res.statusText}`);
  }

  const newSessionId = res.headers.get('Mcp-Session-Id');
  if (newSessionId) {
    sessionId = newSessionId;
  }

  const contentType = res.headers.get('Content-Type') || '';

  if (contentType.includes('text/event-stream')) {
    return parseSSEResponse(res);
  }

  return (await res.json()) as JsonRpcResponse;
}

async function parseSSEResponse(res: Response): Promise<JsonRpcResponse> {
  const text = await res.text();
  const lines = text.split('\n');
  let lastData = '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      lastData = line.slice(6);
    }
  }

  if (!lastData) {
    throw new Error('No data in SSE response');
  }

  return JSON.parse(lastData) as JsonRpcResponse;
}

async function sendNotification(
  method: string,
  params: Record<string, unknown> | undefined,
  email: string,
  password: string,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'rhl-email': email,
    'rhl-pass': password,
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }

  await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method, params }),
  });
}

async function initialize(email: string, password: string): Promise<void> {
  const response = await mcpRequest(
    {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'recipekeeper-assesser', version: '1.0.0' },
      },
      id: nextId(),
    },
    email,
    password,
  );

  if (response.error) {
    throw new Error(`MCP init failed: ${response.error.message}`);
  }

  await sendNotification('notifications/initialized', undefined, email, password);
}

export async function listTools(
  email: string,
  password: string,
): Promise<McpTool[]> {
  await initialize(email, password);

  const response = await mcpRequest(
    { jsonrpc: '2.0', method: 'tools/list', params: {}, id: nextId() },
    email,
    password,
  );

  if (response.error) {
    throw new Error(`tools/list failed: ${response.error.message}`);
  }

  const result = response.result as { tools: McpTool[] };
  return result.tools;
}

export async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  email: string,
  password: string,
): Promise<McpToolResult> {
  if (!sessionId) {
    await initialize(email, password);
  }

  const response = await mcpRequest(
    {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: args },
      id: nextId(),
    },
    email,
    password,
  );

  if (response.error) {
    throw new Error(`Tool call "${toolName}" failed: ${response.error.message}`);
  }

  return response.result as McpToolResult;
}

function getToolText(result: McpToolResult): string {
  return result.content
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text!)
    .join('\n');
}

// --- Product search ---

export interface KnusprProduct {
  id: number;
  name: string;
  price?: string;
  unit?: string;
  image?: string;
}

export async function searchProducts(
  query: string,
  email: string,
  password: string,
  prompt?: string,
): Promise<KnusprProduct[]> {
  const searchQuery = prompt ? `${prompt}: ${query}` : query;

  const result = await callTool(
    'batch_search_products',
    { queries: [{ query: searchQuery }] },
    email,
    password,
  );

  const text = getToolText(result);

  try {
    const parsed = JSON.parse(text);
    // batch_search_products returns an array of query results
    const products: KnusprProduct[] = [];
    const items = Array.isArray(parsed) ? parsed : parsed.results || parsed.products || [parsed];

    for (const item of items) {
      // Each batch result may have a products array
      const prods = item.products || item.items || (Array.isArray(item) ? item : [item]);
      for (const p of prods) {
        if (p.id || p.product_id) {
          products.push({
            id: Number(p.id || p.product_id),
            name: String(p.name || p.title || ''),
            price: p.price != null ? String(p.price) : (p.unit_price != null ? String(p.unit_price) : undefined),
            unit: p.unit ? String(p.unit) : undefined,
            image: p.image ? String(p.image) : (p.image_url ? String(p.image_url) : undefined),
          });
        }
      }
    }

    return products;
  } catch {
    // Not JSON — return raw text
    return [{ id: 0, name: text }];
  }
}

// --- Shopping list management ---

export async function getShoppingLists(
  email: string,
  password: string,
): Promise<Array<{ id: number; name: string; itemCount: number }>> {
  const result = await callTool('get_user_shopping_lists_preview', {}, email, password);
  const text = getToolText(result);

  try {
    const parsed = JSON.parse(text);
    const lists = Array.isArray(parsed) ? parsed : parsed.lists || parsed.shopping_lists || [];
    return lists.map((l: Record<string, unknown>) => ({
      id: Number(l.id || l.list_id || 0),
      name: String(l.name || ''),
      itemCount: Number(l.item_count || l.itemCount || l.count || 0),
    }));
  } catch {
    return [];
  }
}

export async function createShoppingList(
  name: string,
  email: string,
  password: string,
): Promise<number> {
  const result = await callTool(
    'create_shopping_list',
    { name, source: 'recipe' },
    email,
    password,
  );
  const text = getToolText(result);

  try {
    const parsed = JSON.parse(text);
    return Number(parsed.id || parsed.list_id || parsed.shopping_list_id || 0);
  } catch {
    throw new Error(`Failed to create shopping list: ${text}`);
  }
}

export async function addProductsToShoppingList(
  listId: number,
  products: Array<{ productId: number; amount: number }>,
  email: string,
  password: string,
): Promise<string> {
  const result = await callTool(
    'add_products_to_shopping_list',
    {
      list_id: listId,
      products: products.map((p) => ({
        product_id: p.productId,
        amount: p.amount,
      })),
    },
    email,
    password,
  );

  return getToolText(result);
}

export function resetSession(): void {
  sessionId = null;
  requestId = 0;
}
