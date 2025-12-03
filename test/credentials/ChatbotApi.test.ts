import { ChatbotApi } from '../../credentials/ChatbotApi.credentials';

describe('ChatbotApi Credentials', () => {
	it('should have correct name and displayName', () => {
		const credentials = new ChatbotApi();
		expect(credentials.name).toBe('chatbotApi');
		expect(credentials.displayName).toBe('Chatbot API');
	});

	it('should have required properties', () => {
		const credentials = new ChatbotApi();
		const properties = credentials.properties;

		expect(properties).toBeDefined();
		expect(properties.length).toBeGreaterThan(0);

		const hostProperty = properties.find((p) => p.name === 'host');
		expect(hostProperty).toBeDefined();
		expect(hostProperty?.required).toBe(true);

		const accessTokenProperty = properties.find((p) => p.name === 'accessToken');
		expect(accessTokenProperty).toBeDefined();
		expect(accessTokenProperty?.required).toBe(true);
	});

	it('should have authenticate configuration', () => {
		const credentials = new ChatbotApi();
		expect(credentials.authenticate).toBeDefined();
		expect(credentials.authenticate.type).toBe('generic');
		expect(credentials.authenticate.properties).toBeDefined();
		expect(credentials.authenticate.properties.headers).toBeDefined();
	});

	it('should have test configuration', () => {
		const credentials = new ChatbotApi();
		expect(credentials.test).toBeDefined();
		expect(credentials.test.request).toBeDefined();
	});
});

