// Custom ESLint rule: no-hardcoded-secrets
// Detects hardcoded API keys, tokens, and secrets
// Security-critical enforcement

module.exports = {
  rules: {
    'no-hardcoded-secrets': {
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value !== 'string') return;

            const value = node.value;
            const filename = context.getFilename();

            // Skip .env files and config files
            if (filename.includes('.env') || filename.includes('next.config')) return;

            // Secret patterns to detect
            const secretPatterns = [
              {
                pattern: /sk_live_[a-zA-Z0-9]{24,}/,
                name: 'Stripe Secret Key'
              },
              {
                pattern: /sk_test_[a-zA-Z0-9]{24,}/,
                name: 'Stripe Test Key'
              },
              {
                pattern: /pk_live_[a-zA-Z0-9]{24,}/,
                name: 'Stripe Public Key (Live)'
              },
              {
                pattern: /[a-zA-Z0-9]{32,}/,
                name: 'Potential API Key (32+ chars)'
              },
              {
                pattern: /AIza[0-9A-Za-z-_]{35}/,
                name: 'Google API Key'
              },
              {
                pattern: /AKIA[0-9A-Z]{16}/,
                name: 'AWS Access Key'
              },
              {
                pattern: /sk-[a-zA-Z0-9]{32,}/,
                name: 'OpenAI API Key'
              }
            ];

            secretPatterns.forEach(({ pattern, name }) => {
              if (pattern.test(value)) {
                // Check if it's referencing process.env (allowed)
                const parent = node.parent;
                const isEnvVar =
                  parent &&
                  parent.type === 'MemberExpression' &&
                  parent.object.type === 'MemberExpression' &&
                  parent.object.object.name === 'process' &&
                  parent.object.property.name === 'env';

                if (!isEnvVar) {
                  context.report({
                    node,
                    message: `⛔ SECURITY VIOLATION: Hardcoded secret detected (${name}). Never commit secrets to code. Use environment variables (process.env.YOUR_SECRET) and .env.local file instead. Secrets in code = security breach.`,
                  });
                }
              }
            });
          }
        };
      }
    }
  }
};
