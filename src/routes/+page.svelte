<script lang="ts">
	import { connected, web3Modal, signerAddress, user, chainId, disconnectWagmi } from '$lib/wagmi';
	import { prepareMessage, verify } from 'eip-login';
	import { getProfileMetadata } from '$lib/services/users';
	import { getNetwork, signMessage, watchAccount, fetchEnsAvatar } from '@wagmi/core';
	import * as blockies from 'blockies-ts';
	const getNonce = async () => {
		const data = await fetch('/api/getNonce');
		const nonce = await data.json();
		return nonce;
	};

	const login = async () => {
		await $web3Modal.openModal();
		const account: any = await waitForAccount();

		const { chain } = getNetwork();

		const nonce: string = await getNonce();

		const message = {
			domain: window.location.host,
			address: account.address,
			statement: 'Sign in with Ethereum to access Trademint.',
			uri: window.location.origin,
			version: '1',
			chainId: chain?.id ? chain.id : 1,
			issuedAt: new Date().toISOString(),
			nonce
		};

		const preparedMessage = prepareMessage(message);
		const signature = await signMessage({
			message: preparedMessage
		});

		const valid = await verify(message, signature);
		if (valid) {
			signerAddress.set(account.address);
			const metadata = await getProfileMetadata(account.address);
			user.set(metadata);
			chainId.set(1);
			connected.set(true);
		} else {
			alert('Message invalid');
		}
	};

	const waitForAccount = () => {
		return new Promise((resolve, reject) => {
			const unsubmodal = $web3Modal.subscribeModal((newState) => {
				if (!newState.open) {
					reject('modal closed');
					unsubmodal();
				}
			});
			const unsub = watchAccount((account) => {
				if (account?.isConnected) {
					resolve(account);
					unsub();
				} else {
					console.warn('🔃 - No Account Connected Yet...');
				}
			});
		});
	};
</script>

{#if $connected}
	<button id="dropdown-button">
		{#if $user?.nameKind}
			{#await fetchEnsAvatar({ name: $user.name })}
				<p>loading</p>
			{:then avatar}
				<img
					src={avatar ? avatar : blockies.create({ seed: $user.address.value }).toDataURL()}
					alt={$user.name}
				/>
				<h1>{$user.name}</h1>
			{/await}
		{:else}
			<img
				src={blockies.create({ seed: $user.address.value }).toDataURL()}
				alt="blockies of user"
			/>
			<h1>{$user.name}</h1>
		{/if}
	</button>
	<button on:click={disconnectWagmi}>logout</button>
{:else}
	<button on:click={login}>connect</button>
{/if}
