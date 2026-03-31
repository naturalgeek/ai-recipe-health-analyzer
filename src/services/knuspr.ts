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
  // Ensure session is initialized
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

export interface KnusprProduct {
  id: string;
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
  const result = await callTool('search', { query: searchQuery }, email, password);

  const text = result.content
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text!)
    .join('\n');

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || p.title || ''),
        price: p.price != null ? String(p.price) : undefined,
        unit: p.unit ? String(p.unit) : undefined,
        image: p.image ? String(p.image) : undefined,
      }));
    }
    if (parsed.products && Array.isArray(parsed.products)) {
      return parsed.products.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || p.title || ''),
        price: p.price != null ? String(p.price) : undefined,
        unit: p.unit ? String(p.unit) : undefined,
        image: p.image ? String(p.image) : undefined,
      }));
    }
  } catch {
    // Not JSON — return as single text result
  }

  return [{ id: '0', name: text }];
}

export async function addToCart(
  productId: string,
  quantity: number,
  email: string,
  password: string,
): Promise<string> {
  const result = await callTool(
    'add_to_cart',
    { product_id: productId, quantity },
    email,
    password,
  );

  return result.content
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text!)
    .join('\n');
}

export function resetSession(): void {
  sessionId = null;
  requestId = 0;
}
