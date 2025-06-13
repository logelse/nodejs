# Publishing Guide for @logelse/nodejs

This document provides instructions for publishing the @logelse/nodejs package to npm.

## Pre-Publishing Checklist

- [x] All source code implemented
- [x] Comprehensive tests written and passing (23/23 tests pass)
- [x] TypeScript compilation successful
- [x] Documentation complete (README.md)
- [x] Examples provided
- [x] Package.json configured correctly
- [x] .npmignore configured
- [x] Build artifacts generated in dist/

## Package Structure

```
@logelse/nodejs/
├── dist/                 # Compiled JavaScript and type definitions
│   ├── index.js         # Main entry point
│   ├── index.d.ts       # TypeScript definitions
│   ├── client.js        # LogelseClient implementation
│   ├── client.d.ts      # Client type definitions
│   ├── types.js         # Type definitions
│   └── types.d.ts       # TypeScript type definitions
├── examples/            # Usage examples (not published)
│   ├── basic-usage.js
│   └── express-integration.js
├── src/                 # Source code (not published)
├── test/                # Tests (not published)
├── README.md            # Documentation
├── LICENSE              # Apache 2.0 License
└── package.json         # Package configuration
```

## Publishing Steps

### 1. Verify Package Contents

Run this command to see what will be published:

```bash
npm pack --dry-run
```

### 2. Test Package Locally

Create a test project and install the package locally:

```bash
# In a separate directory
mkdir test-logelse
cd test-logelse
npm init -y
npm install /path/to/logelse/nodejs
```

### 3. Login to npm

```bash
npm login
```

### 4. Publish to npm

For first-time publishing:

```bash
npm publish --access public
```

For subsequent versions:

```bash
# Update version first
npm version patch  # or minor/major
npm publish
```

## Version Management

The package follows semantic versioning:

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Current version: 1.0.0

## Package Features

### Core Features
- ✅ Non-blocking async operations
- ✅ Automatic retry logic with configurable attempts
- ✅ Comprehensive input validation
- ✅ TypeScript support with full type definitions
- ✅ Error handling with detailed error messages
- ✅ Batch logging support
- ✅ Configurable timeouts and base URLs

### API Methods
- `log(entry)` - Send single log entry
- `logBatch(entries)` - Send multiple log entries
- `logMessage(level, message, appName, appUuid)` - Convenience method
- `createLogEntry(level, message, appName, appUuid)` - Create log entry

### Configuration Options
- `baseUrl` - Custom API endpoint
- `timeout` - Request timeout
- `retryAttempts` - Number of retry attempts
- `retryDelay` - Delay between retries
- `debug` - Enable debug logging

## Testing

The package includes comprehensive tests:

```bash
npm test              # Run all tests
npm run test:coverage # Run tests with coverage
npm run test:watch    # Run tests in watch mode
```

Test coverage includes:
- Constructor validation
- Log entry validation
- Retry logic
- Error handling
- Batch operations
- Convenience methods

## Dependencies

### Runtime Dependencies
- `axios` ^1.6.0 - HTTP client

### Development Dependencies
- `typescript` ^5.0.0 - TypeScript compiler
- `jest` ^29.5.0 - Testing framework
- `ts-jest` ^29.1.0 - TypeScript Jest preset
- `@types/node` ^20.0.0 - Node.js type definitions
- `@types/jest` ^29.5.0 - Jest type definitions

## License

Apache License 2.0 - See LICENSE file for details.

## Support

For issues or questions:
1. Check the README.md for usage examples
2. Review the examples/ directory
3. Create an issue in the repository
4. Contact the Logelse team

## Post-Publishing

After successful publishing:

1. Verify the package on npmjs.com
2. Test installation: `npm install @logelse/nodejs`
3. Update any documentation or examples as needed
4. Announce the release to users
