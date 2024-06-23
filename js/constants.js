// Update application version for every new release
const applicationVersion = "v0.2.2";

const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
const minaTokenId = "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";
const base58Alphabet =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const controlCharsRegExp = /[\x00-\x1F\x7F]/g;
const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];
const initialBreadcrumbsItem = `<li title="Network" class="indicator">
<div id="breadcrumbsLoader"></div>
<svg
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="0 0 24 24"
class="w-4 h-4 stroke-current"
>
<path
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
></path>
</svg></li>`;
const basicNetworkStateGraphQlQuery = {
  query: `{
    syncStatus
    daemonStatus {
      chainId
      consensusConfiguration {
        k
        slotDuration
        slotsPerEpoch
      }
      commitId
      uptimeSecs
      snarkWorkFee
      numAccounts
    }
  }`,
  variables: null,
  operationName: null,
};
const basicRecentBlocksGraphQlQuery = {
  query: `{
    bestChain(maxLength: 5000) {
      protocolState {
        consensusState {
          blockHeight
          epoch
          slot
        }
        blockchainState {
          date
        }
      }
      commandTransactionCount
      stateHash
      transactions {
        userCommands {
          failureReason
        }
        zkappCommands {
          failureReason {
            failures
            index
          }
        }
      }
    }
  }`,
  variables: null,
  operationName: null,
};
const valueTransfersMempoolGraphQlQuery = {
  query: `{
    pooledUserCommands {
      feePayer {
        publicKey
      }
      receiver {
        publicKey
      }
      kind
      amount
      fee
      nonce
      hash
      memo
    }
  }`,
  variables: null,
  operationName: null,
};
const zkAppsMempoolGraphQlQuery = {
  query: `{
    pooledZkappCommands {
      hash
      zkappCommand {
        feePayer {
          body {
            fee
            nonce
            publicKey
          }
        }
        accountUpdates {
          body {
            publicKey
          }
        }
        memo
      }
    }
  }`,
  variables: null,
  operationName: null,
};
const getBlockDetailsGraphQlQuery = function (numberOrHash) {
  const searchBy = isNaN(numberOrHash)
    ? `stateHash: "${numberOrHash}"`
    : `height: ${numberOrHash}`;
  return {
    query: `{
      block(${searchBy}) {
        commandTransactionCount
        stateHash
        protocolState {
          consensusState {
            blockHeight
            epoch
            slot
            slotSinceGenesis
            lastVrfOutput
            totalCurrency
            superchargedCoinbase
          }
          previousStateHash
          blockchainState {
            date
          }
        }
        creatorAccount {
          publicKey
        }
        winnerAccount {
          publicKey
        }
        transactions {
          coinbase
          coinbaseReceiverAccount {
            publicKey
          }
          feeTransfer {
            fee
            recipient
            type
          }
          userCommands {
            failureReason
            feePayer {
              publicKey
            }
            receiver {
              publicKey
            }
            kind
            amount
            fee
            nonce
            hash
            memo
          }
          zkappCommands {
            failureReason {
              failures
              index
            }
            hash
            zkappCommand {
              feePayer {
                body {
                  fee
                  nonce
                  publicKey
                }
              }
              accountUpdates {
                body {
                  publicKey
                }
              }
              memo
            }
          }
        }
      }
    }`,
    variables: null,
    operationName: null,
  };
};
const getAccountsDetailsGraphQlQuery = function (publicKey) {
  return {
    query: `{
      accounts(publicKey: "${publicKey}") {
        actionState
        publicKey
        index
        nonce
        inferredNonce
        balance {
          total
          locked
          liquid
          unknown
          stateHash
          blockHeight
        }
        locked
        zkappState
        zkappUri
        stakingActive
        timing {
          cliffAmount
          cliffTime
          initialMinimumBalance
          vestingPeriod
          vestingIncrement
        }
        votingFor
        privateKeyPath
        permissions {
          editActionState
          editState
          incrementNonce
          receive
          send
          setDelegate
          setPermissions
          setTokenSymbol
          setVerificationKey {
            auth
            txnVersion
          }
          setVotingFor
          setZkappUri
          setTiming
          access
        }
        tokenSymbol
        tokenId
        delegateAccount {
          publicKey
        }
        delegators {
          publicKey
        }
        verificationKey {
          hash
          verificationKey
        }
        receiptChainHash
      }
    }
  `,
    variables: null,
    operationName: null,
  };
};
const getTokenDetailsGraphQlQuery = function (tokenId) {
  return {
    query: `{
      tokenOwner(tokenId: "${tokenId}") {
        zkappUri
        tokenSymbol
      }
    }
  `,
    variables: null,
    operationName: null,
  };
};
const daemonStatusGraphQlQuery = {
  query: `{
    bestChain(maxLength: 1) {
      protocolState {
        consensusState {
          blockHeight
          epoch
          slot
          slotSinceGenesis
        }
      }
    }
    daemonStatus {
      blockchainLength
      blockProductionKeys
      catchupStatus
      chainId
      coinbaseReceiver
      commitId
      confDir
      consensusConfiguration {
        acceptableNetworkDelay
        delta
        genesisStateTimestamp
        epochDuration
        k
        slotDuration
        slotsPerEpoch
      }
      consensusMechanism
      userCommandsSent
      uptimeSecs
      syncStatus
      peers {
        host
        libp2pPort
        peerId
      }
      numAccounts
      addrsAndPorts {
        bindIp
        clientPort
        externalIp
        libp2pPort
        peer {
          host
          libp2pPort
          peerId
        }
      }
    }
    connectionGatingConfig {
      isolate
      trustedPeers {
        host
        libp2pPort
        peerId
      }
      bannedPeers {
        host
        libp2pPort
        peerId
      }
    }
    currentSnarkWorker {
      fee
      account {
        publicKey
      }
    }
    initialPeers
    runtimeConfig
    timeOffset
    trustStatusAll {
      bannedStatus
      ipAddr
      peerId
      trust
    }
    genesisConstants {
      accountCreationFee
      coinbase
      genesisTimestamp
    }
    version
  }`,
  variables: null,
  operationName: null,
};
const extendedMempoolGraphQlQuery = {
  query: `{
    pooledUserCommands {
      feePayer {
        publicKey
      }
      receiver {
        publicKey
      }
      kind
      amount
      failureReason
      fee
      feeToken
      memo
      nonce
      hash
      id
      token
      validUntil
    }
    pooledZkappCommands {
      hash
      failureReason {
        failures
        index
      }
      zkappCommand {
        memo
        feePayer {
          authorization
          body {
            fee
            nonce
            publicKey
            validUntil
          }
        }
        accountUpdates {
          authorization {
            proof
            signature
          }
          body {
            balanceChange {
              magnitude
              sgn
            }
            callData
            callDepth
            events
            incrementNonce
            preconditions {
              account {
                balance {
                  lower
                  upper
                }
                delegate
                isNew
                nonce {
                  upper
                  lower
                }
                provedState
                receiptChainHash
                actionState
                state
              }
              network {
                blockchainLength {
                  lower
                  upper
                }
                globalSlotSinceGenesis {
                  upper
                  lower
                }
                minWindowDensity {
                  lower
                  upper
                }
                nextEpochData {
                  epochLength {
                    lower
                    upper
                  }
                  ledger {
                    hash
                    totalCurrency {
                      lower
                      upper
                    }
                  }
                  lockCheckpoint
                  seed
                  startCheckpoint
                }
                snarkedLedgerHash
                stakingEpochData {
                  epochLength {
                    lower
                    upper
                  }
                  ledger {
                    hash
                    totalCurrency {
                      lower
                      upper
                    }
                  }
                  lockCheckpoint
                  seed
                  startCheckpoint
                }
                totalCurrency {
                  lower
                  upper
                }
              }
              validWhile {
                lower
                upper
              }
            }
            publicKey
            tokenId
            useFullCommitment
            update {
              appState
              delegate
              permissions {
                editActionState
                editState
                incrementNonce
                receive
                send
                setDelegate
                setPermissions
                setTokenSymbol
                setVotingFor
                setVerificationKey {
                  auth
                  txnVersion
                }
                setZkappUri
                access
                setTiming
              }
              tokenSymbol
              timing {
                cliffAmount
                cliffTime
                initialMinimumBalance
                vestingIncrement
                vestingPeriod
              }
              verificationKey {
                data
                hash
              }
              votingFor
              zkappUri
            }
            actions
            authorizationKind {
              isProved
              isSigned
              verificationKeyHash
            }
            implicitAccountCreationFee
            mayUseToken {
              inheritFromParent
              parentsOwnToken
            }
          }
        }
      }
      id
    }
  }`,
  variables: null,
  operationName: null,
};
const extendedRecentBlocksGraphQlQuery = {
  query: `{
    bestChain(maxLength: 5000) {
      protocolState {
        consensusState {
          blockHeight
          epoch
          slot
          slotSinceGenesis
          lastVrfOutput
        }
        previousStateHash
        blockchainState {
          date
        }
      }
      commandTransactionCount
      stateHash
      transactions {
        userCommands {
          feePayer {
            publicKey
          }
          receiver {
            publicKey
          }
          kind
          amount
          failureReason
          fee
          feeToken
          memo
          nonce
          hash
          id
          token
          validUntil
        }
        zkappCommands {
          hash
          failureReason {
            failures
            index
          }
          zkappCommand {
            memo
            feePayer {
              authorization
              body {
                fee
                nonce
                publicKey
                validUntil
              }
            }
            accountUpdates {
              authorization {
                proof
                signature
              }
              body {
                balanceChange {
                  magnitude
                  sgn
                }
                callData
                callDepth
                events
                incrementNonce
                preconditions {
                  account {
                    balance {
                      lower
                      upper
                    }
                    delegate
                    isNew
                    nonce {
                      upper
                      lower
                    }
                    provedState
                    receiptChainHash
                    actionState
                    state
                  }
                  network {
                    blockchainLength {
                      lower
                      upper
                    }
                    globalSlotSinceGenesis {
                      upper
                      lower
                    }
                    minWindowDensity {
                      lower
                      upper
                    }
                    nextEpochData {
                      epochLength {
                        lower
                        upper
                      }
                      ledger {
                        hash
                        totalCurrency {
                          lower
                          upper
                        }
                      }
                      lockCheckpoint
                      seed
                      startCheckpoint
                    }
                    snarkedLedgerHash
                    stakingEpochData {
                      epochLength {
                        lower
                        upper
                      }
                      ledger {
                        hash
                        totalCurrency {
                          lower
                          upper
                        }
                      }
                      lockCheckpoint
                      seed
                      startCheckpoint
                    }
                    totalCurrency {
                      lower
                      upper
                    }
                  }
                  validWhile {
                    lower
                    upper
                  }
                }
                publicKey
                tokenId
                useFullCommitment
                update {
                  appState
                  delegate
                  permissions {
                    editActionState
                    editState
                    incrementNonce
                    receive
                    send
                    setDelegate
                    setPermissions
                    setTokenSymbol
                    setVotingFor
                    setVerificationKey {
                      auth
                      txnVersion
                    }
                    setZkappUri
                    access
                    setTiming
                  }
                  tokenSymbol
                  timing {
                    cliffAmount
                    cliffTime
                    initialMinimumBalance
                    vestingIncrement
                    vestingPeriod
                  }
                  verificationKey {
                    data
                    hash
                  }
                  votingFor
                  zkappUri
                }
                actions
                authorizationKind {
                  isProved
                  isSigned
                  verificationKeyHash
                }
                implicitAccountCreationFee
                mayUseToken {
                  inheritFromParent
                  parentsOwnToken
                }
              }
            }
          }
          id
        }
      }
    }
  }`,
  variables: null,
  operationName: null,
};
const getAccountLockGraphQlQuery = function (publicKey) {
  return {
    query: `mutation {
      lockAccount(input: {publicKey: "${publicKey}"}) {
        account {
          publicKey
        }
      }
    }
  `,
    variables: null,
    operationName: null,
  };
};
const getAccountUnlockGraphQlQuery = function (publicKey, passPhrase) {
  return {
    query: `mutation {
      unlockAccount(input: {publicKey: "${publicKey}", password: "${passPhrase}"}) {
        account {
          publicKey
        }
      }
    }
  `,
    variables: null,
    operationName: null,
  };
};
