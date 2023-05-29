import { EthereumClient, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/html';
import {
	InjectedConnector,
	configureChains,
	createConfig,
	getAccount,
	watchAccount,
	watchNetwork,
	disconnect
} from '@wagmi/core';
import { mainnet, goerli } from '@wagmi/core/chains';
import { get, writable } from 'svelte/store';
import { PUBLIC_WALLETCONNECT_PROJECTID, PUBLIC_ALCHEMY_KEY } from '$env/static/public';
import { alchemyProvider } from '@wagmi/core/providers/alchemy';
import { getProfileMetadata } from '$lib/services/users';
import { WalletConnectConnector } from '@wagmi/core/connectors/walletConnect';

const projectId = PUBLIC_WALLETCONNECT_PROJECTID;
const defaultChains = [mainnet, goerli];

const walletConnectConnector = new WalletConnectConnector({
	chains: defaultChains,
	options: {
		projectId,
		showQrModal: false
	}
});

export const connected = writable<boolean>(false);
export const isConnecting = writable<boolean>(false);
export const user = writable<any | null>(null);
export const chainId = writable<number | null>(null);
export const signerAddress = writable<string>('');
export const web3Modal = writable<Web3Modal>();

let unWatchAccount: () => void;
let unWatchNetwork: () => void;

const unSubscribe = () => {
	if (unWatchNetwork && unWatchAccount) {
		unWatchAccount();
		unWatchNetwork();
	}
	connected.set(false);
	chainId.set(null);
	signerAddress.set('');
};

export const configureWagmi = () => {
	const { chains, publicClient, webSocketPublicClient } = configureChains(defaultChains, [
		alchemyProvider({ apiKey: PUBLIC_ALCHEMY_KEY }),
		w3mProvider({ projectId })
	]);

	const wagmiClient = createConfig({
		autoConnect: true,
		webSocketPublicClient,
		publicClient,
		connectors: [new InjectedConnector({ chains }), walletConnectConnector]
	});

	const ethereumClient = new EthereumClient(wagmiClient, chains);
	const options: any = {
		projectId,
		themeMode: 'dark'
	};
	const modal = new Web3Modal(options, ethereumClient);

	web3Modal.set(modal);
};

export const init = async () => {
	try {
		unSubscribe();
		isConnecting.set(true);
		const account: any = getAccount();
		unWatchAccount = watchAccount(async (account) => {
			if (
				account.isConnected &&
				account.address != get(signerAddress) &&
				get(connected) &&
				account.address
			) {
				signerAddress.set(account.address);
			} else if (account.isDisconnected && get(connected)) {
				await disconnectWagmi();
			}
		});

		unWatchNetwork = watchNetwork(async ({ chain }) => {
			if (chain) chainId.set(chain.id);
		});

		if (account.address) {
			const metadata = await getProfileMetadata(account.address);
			user.set(metadata);
			isConnecting.set(false);
			connected.set(true);
			signerAddress.set(account.address);
		}
		isConnecting.set(false);
	} catch (err) {
		console.log(err);
	}
};

export const disconnectWagmi = async () => {
	await disconnect();
	connected.set(false);
	chainId.set(null);
	signerAddress.set('');
};
