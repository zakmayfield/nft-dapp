import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import shapeWorld from './utils/abiData.json'
import Loader from 'react-loader-spinner'

// Constants
const PROJECT_NAME = 'Shape World';
const TWITTER_HANDLE = 'mayf_nft';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// udate value to hold your marketplace route
// i.e. OpenSea: https://testnets.opensea.io/assets
// const MARKETPLACE_LINK = 'https://testnets.opensea.io/assets';
// Scan link like Etherscan or FTMscan
const SCAN_LINK = 'https://ftmscan.com/tx'
// Total available NFTs available for minting
const TOTAL_MINT_COUNT = 50;
// update required Chain
// i.e. Fantom Opera = 0xfa
const CHAIN_REQUIRED = '0xfa'
// * deployed contract address
const CONTRACT_ADDRESS = '0xe9898C9670504F223Bed2708832a18A0667865B9';

const App = () => {
  const [eth] = useState(window.ethereum)
  const [currentAccount, setCurrentAccount] = useState('')
  const [totalMinted, setTotalMinted] = useState(0)
  const [isMinting, setIsMinting] = useState(false)

  // Check if wallet is connected via window.ethereum
  // and check which chain the user is connected to
  const checkIfWalletIsConnected = async () => {
    // const { ethereum } = window;
    if (eth) {
      console.log('✅ Metamask is installed\n\n🔎 Checking Chain ID')
      const chainId = await eth.request({ method: 'eth_chainId' });

      // change chain to check for desired id 
      if (chainId !== CHAIN_REQUIRED) {
        console.log(`🚫 Wrong network detected. Current: ${chainId} - Required: ${CHAIN_REQUIRED}`)
      } else {
        console.log(`⛓ ${CHAIN_REQUIRED}`)
        console.log('🔎 Checking accounts')
        const accounts = await eth.request({ method: 'eth_accounts' });
        if(accounts.length !== 0){
          getTotalNfts();
          const account = accounts[0]
          console.log('🎉 Account found! =>', account)
          setCurrentAccount(account)
          // setupEventListener()
        } else {
          console.log('🚫 No account detected')
        }
      }
    } else {
      console.log('🚫 Please install Metamask')
    }
  };

  // first render of the app that checks if wallet is connected
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []) // eslint-disable-line

  // page reload if chain is changed
  const handleChainChange = () => {
    console.log('Looks like the chain was changed')
    window.location.reload();
  }

  // set account and reload if account changes
  const handleAccountsChange = async () => {
     eth.request({ method: 'eth_accounts' })
      .then(account => setCurrentAccount(account))
    window.location.reload()
  }

  // called whenever the user changes the window object for connected chain
  eth.on('chainChanged', handleChainChange)
  
  //called whenever accounts change
  eth.on('accountsChanged', handleAccountsChange)

  // fn to connect fe to metamask wallet
  const connectWallet = async () => {
    console.log('🔎 Checking MetaMask...')
    try {
      if (!eth) {
        console.log('🚫 Please install MetaMask')
      } else {
        console.log('🔎 Searching for account')
        const accounts = await eth.request({ method: 'eth_requestAccounts' })
        console.log('✅ Account connected =>', accounts[0])
        setCurrentAccount(accounts[0])
        // setupEventListener()
      }
    } catch(error) {
      console.log('🚫 Could not connect wallet =>', error)
    }
  }

  const getTotalNfts = async () => {
    try {
      if (eth) {
        const provider = new ethers.providers.Web3Provider(eth)
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, shapeWorld.abi, signer);

        let bigNum = await connectedContract.getTotalNFTsMinted();
        let totalMinted = parseInt(bigNum, 10);
        console.log(`Supply: ${totalMinted}/${TOTAL_MINT_COUNT}` )
        setTotalMinted(totalMinted)
      }
    } catch(error) {
      console.log('Total NFT Error ', error)
    }
  }

  // fn call to our contract to call our makeCoolNFT method
  const askContractToMint = async () => {
    try {
      if (eth){
        const provider = new ethers.providers.Web3Provider(eth)
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, shapeWorld.abi, signer)

        console.log('⛽️ Please accept gas fee...')
        let nftTxn = await connectedContract.mint(1);

        console.log('⛏ Mining transaction...')
        setIsMinting(true)
        await nftTxn.wait();
        setIsMinting(false)

        getTotalNfts();
        
        console.log(`✅ Transaction complete, please view ${SCAN_LINK}/${nftTxn.hash} for details`)
      } else {
        console.log('🚫 Please install MetaMask')
      }
    } catch(error) {
      console.log('🚫 Error while trying to mint: ', error)
    }
  }

  return (
    <div className='App'>
      <div className='container'>
        <div className='header-container'>
          <p className='header gradient-text'>AboveSnakes.eth</p>
          {isMinting ? (
            <div className='sub-text-button'>
              Minting, Please Wait for TX to Complete <Loader type="TailSpin" height={40} width={40} className="loader"/>
            </div>
          ) : (
            <p className='sub-text'>
              Mint {PROJECT_NAME || 'some NFTs below'} below 👇
            </p>
          )}
          {!currentAccount ? (
            <button
              onClick={connectWallet}
              className='cta-button connect-wallet-button'
            >
              Connect to Wallet
            </button>
          ) : (
            <button onClick={askContractToMint} className={`cta-button connect-wallet-button ${isMinting ? 'disabled-btn' : ''}`} disabled={isMinting ? true : false}>
              {isMinting ? `Minting...` : 'Mint'}
            </button>
          )}

          {currentAccount && <p className='sub-text'>{`${totalMinted}/${TOTAL_MINT_COUNT} NFTs Minted`}</p>}
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
