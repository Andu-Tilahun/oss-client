import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Inlines Angular `templateUrl` and `styleUrls` at transform time so
 * Angular's JIT compiler in TestBed gets the template content without
 * needing to fetch external files.
 */
function inlineAngularResources() {
  return {
    name: 'inline-angular-resources',
    transform(code: string, id: string) {
      if (!id.endsWith('.ts') || id.endsWith('.spec.ts') || id.endsWith('.vitest.spec.ts')) {
        return;
      }
      const dir = path.dirname(id);
      let result = code;

      // Replace templateUrl
      result = result.replace(
        /templateUrl:\s*['"]([^'"]+)['"]/g,
        (_, url: string) => {
          const file = path.resolve(dir, url);
          if (!fs.existsSync(file)) return _;
          const content = fs.readFileSync(file, 'utf-8')
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');
          return `template: \`${content}\``;
        }
      );

      // Replace styleUrls (keep simple — just empty styles for tests)
      result = result.replace(
        /styleUrls?:\s*\[[^\]]*\]/g,
        'styles: []'
      );
      result = result.replace(
        /styleUrl:\s*['"][^'"]+['"]/g,
        'styles: []'
      );

      return result;
    },
  };
}

export default defineConfig({
  plugins: [
    inlineAngularResources(),
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  resolve: {
    mainFields: ['module', 'main'],
  },
  oxc: false,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.vitest.ts'],
    include: ['src/**/*.vitest.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/features/templates/**'],
      reporter: ['text', 'html'],
    },
  },
});
