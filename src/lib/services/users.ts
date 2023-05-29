import { isAddress } from 'viem';
import publicClient from '$lib/utils/publicClient';
import { normalize } from 'viem/ens';

export const getProfileMetadata = async (address: string) => {
	const metadata = {} as ProfileMetadata;
	if (isAddress(address)) {
		metadata.address = {
			kind: 'ethereum',
			value: address.toLowerCase()
		};
		metadata.id = `ethereum:${address.toLowerCase()}`;

		try {
			const ensName = await publicClient.getEnsName({ address });
			if (!ensName) throw Error('Error fetching ens name');
			metadata.name = ensName;
			metadata.slug = ensName;
			metadata.nameKind = 'ens';
		} catch (err) {
			//No ENS name found
			metadata.name = address;
			metadata.slug = address;
		}
	} else {
		try {
			const resolvedAddress = await publicClient.getEnsAddress({ name: normalize(address) });
			if (!resolvedAddress) throw Error('Error fetching eth address');

			metadata.address = {
				kind: 'ethereum',
				value: resolvedAddress.toLowerCase()
			};
			metadata.id = `ethereum:${resolvedAddress.toLowerCase()}`;

			metadata.name = address;
			metadata.slug = address;
			metadata.nameKind = 'ens';
		} catch (err) {
			//ENS is invalid
			throw Error('ENS is invalid or has no resolver');
		}
	}

	return metadata;
};
