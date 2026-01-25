#!/bin/bash

set -e

echo "Building RecipeKeeper Assesser..."

# Clean previous builds
rm -rf dist
rm -f recipekeeper-assesser.tar.gz

# Build production version
npm run build

# Create tarball for easy deployment
cd dist
tar -czf ../recipekeeper-assesser.tar.gz .
cd ..

echo ""
echo "Build complete!"
echo ""
echo "Files ready in: ./dist/"
echo "Archive ready:  ./recipekeeper-assesser.tar.gz"
echo ""
echo "To deploy, either:"
echo ""
echo "  1) Copy dist folder contents:"
echo "     sudo cp -r dist/* /var/www/html/"
echo ""
echo "  2) Or extract the tarball:"
echo "     sudo tar -xzf recipekeeper-assesser.tar.gz -C /var/www/html/"
echo ""
