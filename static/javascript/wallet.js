import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
    WagmiCore,
    WagmiCoreChains
} from "https://unpkg.com/@web3modal/ethereum@2.7.1";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.7.1";

// Destructure functions and chains from the main Wagmi objects.
const {
    mainnet, bsc, polygon, arbitrum, optimism, avalanche
} = WagmiCoreChains;

bsc.rpcUrls.default.http = ['https://bsc-dataseed.binance.org/'];
bsc.rpcUrls.public.http = ['https://bsc-dataseed.binance.org/'];

const {
    configureChains, createConfig, getAccount, fetchBalance,
    watchAccount, switchNetwork, getNetwork, disconnect
} = WagmiCore;

// --- 1. Project Configuration & Constants ---
const projectId = "9f4bc10d7c6a796e8abef09399f31524";
const chains = [mainnet, bsc, polygon, arbitrum, optimism, avalanche];
const supportedNetworks = {
    1: { name: 'Ethereum', logo: '/static/images/ethereum.png', usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    56: { name: 'BNB Smart Chain', logo: '/static/images/bnb.png', usdtAddress: '0x55d398326f99059fF775485246999027B3197955' },
    137: { name: 'Polygon', logo: '/static/images/polygon.png', usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
    42161: { name: 'Arbitrum', logo: '/static/images/arbitrum.png', usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
    10: { name: 'Optimism', logo: '/static/images/optimism.png', usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
    43114: { name: 'Avalanche', logo: '/static/images/avalanche.png', usdtAddress: '0x9702230A8Ea53601f5E655328f223d9A37Af5888' },
};

// --- 2. Initialize Wagmi & Web3Modal Clients ---
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, chains }),
    publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3Modal = new Web3Modal({ projectId }, ethereumClient);

// --- 3. Helper Functions ---
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// --- 4. UI Update Functions ---

/**
 * Updates all UI elements to a "connected" state.
 */
async function setConnectedUI() {
    const walletContainer = document.getElementById('walletContainer');
    const account = getAccount();
    if (!account.isConnected || !account.address) return;

    const { address } = account;
    const { chain } = getNetwork();
    if (!chain) return;
    const chainId = chain.id;
    const networkInfo = supportedNetworks[chainId];

    // Hide connect button, show user wallet button
    const connectBtn = document.getElementById('connectWallet');
    const userWalletBtn = document.getElementById('usrWallet');

    if (connectBtn) {
        connectBtn.style.display = 'none';
        connectBtn.style.setProperty('display', 'none', 'important');
    }

    if (userWalletBtn) {
        userWalletBtn.style.display = 'flex';
        userWalletBtn.style.removeProperty('display');
        const walletAddressSpan = userWalletBtn.querySelector('.wallet-address');
        if (walletAddressSpan) {
            walletAddressSpan.textContent = formatAddress(address);
        }
    }

    // Update offcanvas details
    const offcanvasAddress = document.getElementById('walletAddress');

    if (offcanvasAddress) {
        offcanvasAddress.textContent = formatAddress(address);
    }
    if (walletContainer) {
        walletContainer.dataset.fullAddress = address;
    }

    const balance = await getUsdtBalance(address, chainId);
    const balanceElement = document.getElementById('usdtBalance');
    if (balanceElement) {
        balanceElement.textContent = balance;
    }

    updateSelectedNetworkDisplay(chainId);

    const offcanvasElement = document.getElementById('offcanvasWallet');
    if (offcanvasElement) {
        bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
    }
}

/**
 * Resets all UI elements to a "disconnected" state.
 */
function setDisconnectedUI() {
    const connectBtn = document.getElementById('connectWallet');
    const userWalletBtn = document.getElementById('usrWallet');
    const balanceElement = document.getElementById('usdtBalance');
    const authElement = document.getElementById('isAuthenticated');

    if (connectBtn) {
        connectBtn.style.display = 'flex';
        connectBtn.style.removeProperty('display');
    }

    if (userWalletBtn) {
        userWalletBtn.style.display = 'none';
        userWalletBtn.style.setProperty('display', 'none', 'important');
    }

    if (balanceElement) {
        balanceElement.textContent = '0.00';
    }

    if (authElement) {
        authElement.value = 'false'; // Mark as logged out
    }
}

/**
 * Populates the network list with logos.
 * CORRECTED: Now uses an <img> tag for consistency and reliability.
 */
function populateNetworkList() {
    const networkList = document.getElementById('networkList');
    if (!networkList) return;

    networkList.innerHTML = '';
    for (const chainId in supportedNetworks) {
        const network = supportedNetworks[chainId];
        const networkItem = `
            <input type="radio" name="nt-rd" class="btn-check" id="nt-${chainId}" autocomplete="off" data-chain-id="${chainId}">
            <label class="btn nt-btn" for="nt-${chainId}">
                <img class="nt-logo" src="${network.logo}" alt="${network.name} logo">
                <div class="nt-name">${network.name}</div>
            </label>
        `;
        networkList.innerHTML += networkItem;
    }
    document.querySelectorAll('.network-rd-btn-group .btn-check').forEach(radio => {
        radio.addEventListener('change', handleNetworkSwitch);
    });
}

/**
 * Updates the selected network button display.
 */
function updateSelectedNetworkDisplay(chainId) {
    const networkInfo = supportedNetworks[chainId];
    if (networkInfo) {
        const networkNameElement = document.getElementById('selectedNetworkName');
        const networkLogoElement = document.getElementById('selectedNetworkLogo');

        if (networkNameElement) {
            networkNameElement.textContent = networkInfo.name;
        }
        if (networkLogoElement) {
            networkLogoElement.innerHTML = `<img src="${networkInfo.logo}" alt="${networkInfo.name}" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }

        localStorage.setItem('selectedNetworkId', chainId);
        const radioToCheck = document.getElementById(`nt-${chainId}`);
        if (radioToCheck) radioToCheck.checked = true;
    }
}

/**
 * Fetches the user's USDT balance.
 */
async function getUsdtBalance(userAddress, chainId) {
    const networkInfo = supportedNetworks[chainId];
    if (!networkInfo || !networkInfo.usdtAddress) return 'N/A';
    try {
        const balance = await fetchBalance({ address: userAddress, token: networkInfo.usdtAddress, chainId: chainId });
        return parseFloat(balance.formatted).toFixed(2);
    } catch (error) {
        console.error('Failed to fetch USDT balance:', error);
        return '0.00';
    }
}

// --- 5. Event Handlers & Backend Interaction ---

/**
 * Opens the Web3Modal.
 */
async function onConnect() {
    try {
        await web3Modal.openModal();
    } catch (error) {
        console.error("Failed to open modal:", error);
    }
}

/**
 * Handles all disconnect logic.
 * CORRECTED: Now properly disconnects the client-side wallet session.
 */
async function onDisconnect() {
    try {
        // 1. Close any open modals first
        if (web3Modal) {
            web3Modal.closeModal();
        }

        // 2. Disconnect the wallet on the client side
        await disconnect();

        // 3. Log out the user from the Django backend
        try {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                await fetch('/users/wallet-disconnect/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error("Django logout failed:", error);
        }

        // 4. Reset the UI to the disconnected state
        setDisconnectedUI();

        console.log('Wallet disconnected successfully');
    } catch (error) {
        console.error("Failed to disconnect wallet:", error);
        // Even if there's an error, reset the UI
        setDisconnectedUI();
    }
}

/**
 * Handles network switching.
 */
async function handleNetworkSwitch(event) {
    const selectedChainId = parseInt(event.target.dataset.chainId, 10);
    try {
        await switchNetwork({ chainId: selectedChainId });
        updateSelectedNetworkDisplay(selectedChainId);

        const offcanvasNetworkElement = document.getElementById('offcanvasNetwork');
        const offcanvasNetworkInstance = bootstrap.Offcanvas.getInstance(offcanvasNetworkElement);
        if (offcanvasNetworkInstance) {
            offcanvasNetworkInstance.hide();
        }

        const offcanvasWalletElement = document.getElementById('offcanvasWallet');
        const offcanvasWalletInstance = new bootstrap.Offcanvas(offcanvasWalletElement);
        offcanvasWalletInstance.show();

    } catch (error) {
        console.error("Failed to switch network:", error);
        const { chain } = getNetwork();
        if (chain) {
            const currentRadio = document.getElementById(`nt-${chain.id}`);
            if (currentRadio) currentRadio.checked = true;
        }
    }
}

// --- 6. Initialization & State Watching ---
document.addEventListener('DOMContentLoaded', () => {

    const connectWalletBtn = document.getElementById('connectWallet');
    const disconnectBtn = document.getElementById('disconnectBtn');

    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', onConnect);
    }

    const copyWalletAddressBtn = document.getElementById("copyWalletAddress");
    if (copyWalletAddressBtn) {
        copyWalletAddressBtn.addEventListener("click", async () => {
            const originalText = copyWalletAddressBtn.innerHTML;
            const walletContainer = document.getElementById('walletContainer');
            const fullAddress = walletContainer ? walletContainer.dataset.fullAddress : null;

            if (fullAddress) {
                try {
                    await navigator.clipboard.writeText(fullAddress);
                    copyWalletAddressBtn.innerHTML = `<div class="ic-container"><span class="material-symbols-rounded">content_copy</span></div>Copied!`;
                    setTimeout(() => {
                        copyWalletAddressBtn.innerHTML = originalText;
                    }, 2000);
                } catch (err) {
                    alert("Failed to copy address.");
                    copyWalletAddressBtn.innerHTML = originalText;
                }
            } else {
                alert("Could not retrieve wallet address.");
            }
        });
    }


    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onDisconnect();
        });
    }

    populateNetworkList();

    // This is the core state manager. It watches for any change.
    watchAccount(async (account) => {
        const authElement = document.getElementById('isAuthenticated');
        let isDjangoAuthenticated = authElement ? authElement.value === 'true' : false;

        if (account.isConnected) {
            // When connected, close the modal and update the UI.
            if (web3Modal) {
                web3Modal.closeModal();
            }

            await setConnectedUI();

            // If not logged into Django, log in. NO PAGE RELOAD.
            if (!isDjangoAuthenticated) {
                try {
                    const csrfToken = getCsrfToken();
                    if (csrfToken) {
                        const response = await fetch('/users/wallet-connect/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },
                            body: JSON.stringify({ wallet_address: account.address }),
                        });
                        const data = await response.json();
                        if (data.status === 'success') {
                            // Mark as authenticated on the client side
                            if (authElement) {
                                authElement.value = 'true';
                            }
                            console.log('Django login successful.');
                        } else {
                            console.error('Django login failed:', data.message);
                        }
                    }
                } catch (error) {
                    console.error('Error during Django login request:', error);
                }
            }
        } else {
            // When disconnected, ensure the UI is reset.
            setDisconnectedUI();
        }
    });

    // Initial check on page load for auto-reconnected users.
    setTimeout(() => {
        const authElement = document.getElementById('isAuthenticated');
        let isDjangoAuthenticated = authElement ? authElement.value === 'true' : false;
        const account = getAccount();

        if (account.isConnected && isDjangoAuthenticated) {
            setConnectedUI();
            const savedNetworkId = localStorage.getItem('selectedNetworkId');
            const { chain } = getNetwork();
            if (chain) {
                updateSelectedNetworkDisplay(savedNetworkId || chain.id);
            }
        } else if (!account.isConnected && isDjangoAuthenticated) {
            // If Django thinks we are logged in but wallet is not connected, log out.
            onDisconnect();
        } else if (account.isConnected && !isDjangoAuthenticated) {
            // If wallet is connected but django is not, log in
            if (web3Modal) {
                web3Modal.closeModal();
            }

            const csrfToken = getCsrfToken();
            if (csrfToken) {
                fetch('/users/wallet-connect/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({ wallet_address: account.address }),
                }).then(res => res.json()).then(data => {
                    if (data.status === 'success' && authElement) {
                        authElement.value = 'true';
                        setConnectedUI();
                    }
                }).catch(error => {
                    console.error('Error during initial login:', error);
                });
            }
        }
    }, 200);

});