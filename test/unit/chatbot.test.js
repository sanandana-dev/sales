const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildSalesContext, handleChatRequest } = require('../../server/src/chat');

describe('AI Sales Chatbot Unit Tests', () => {
  describe('buildSalesContext', () => {
    it('returns a structured context object with hasData boolean and text string', () => {
      const context = buildSalesContext('What is our total revenue?');
      assert.strictEqual(typeof context, 'object');
      assert.strictEqual(typeof context.hasData, 'boolean');
      assert.strictEqual(typeof context.text, 'string');
      assert.ok(context.text.length > 0);
    });

    it('contains store summary metrics if database has sales or proper fallback message', () => {
      const context = buildSalesContext();
      if (context.hasData) {
        assert.ok(context.text.includes('overallSummary'));
        assert.ok(context.text.includes('totalRevenue'));
        assert.ok(context.text.includes('categoryBreakdown'));
      } else {
        assert.ok(context.text.includes('SALES_DATA STATUS'));
      }
    });
  });

  describe('handleChatRequest - Configuration & Validation', () => {
    it('returns helpful setup message when NVIDIA_API_KEY is missing', async () => {
      process.env.TEST_NO_KEY = '1';

      const req = {
        body: {
          message: 'What is our best selling product?'
        }
      };

      let responseStatusCode = 200;
      let responseBody = null;

      const res = {
        status(code) {
          responseStatusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };

      await handleChatRequest(req, res);

      delete process.env.TEST_NO_KEY;

      assert.strictEqual(responseStatusCode, 200);
      assert.strictEqual(responseBody.configured, false);
      assert.ok(responseBody.reply.includes('NVIDIA_API_KEY'));
    });

    it('rejects empty or whitespace-only messages with 400', async () => {
      const req = {
        body: {
          message: '   '
        }
      };

      let responseStatusCode = 200;
      let responseBody = null;

      const res = {
        status(code) {
          responseStatusCode = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        }
      };

      await handleChatRequest(req, res);

      assert.strictEqual(responseStatusCode, 400);
      assert.strictEqual(responseBody.error, 'Message is required and must be a non-empty string.');
    });
  });
});
