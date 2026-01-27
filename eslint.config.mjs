import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // 커스텀 규칙
  {
    rules: {
      // hydration 처리를 위한 mounted 패턴에서 setState 사용 허용
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
