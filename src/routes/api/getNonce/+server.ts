import { json } from '@sveltejs/kit';
import { generateNonce } from 'eip-login';

export const GET = async () => {
	return json(generateNonce());
};
