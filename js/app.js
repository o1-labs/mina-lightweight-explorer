(async () => {
  const selectedGraphQlEndpoint = localStorage.getItem(
    "minaExplorerSelectedGraphQlEndpoint"
  );
  const graphQlEndpoints = JSON.parse(
    localStorage.getItem("minaExplorerGraphQlEndpoints")
  );
  const autoUpdateInterval = localStorage.getItem(
    "minaExplorerAutoUpdateInterval"
  );
  const ellipsifyLength = localStorage.getItem("minaExplorerEllipsifyLength");
  const selectedTheme = localStorage.getItem("minaExplorerSelectedTheme");
  const urlSearchParams = new URLSearchParams(window.location.search);
  let currentPage = "N/A";

  const breadcrumbs = document.getElementById("breadcrumbs");
  const addGraphQlEndpoint = document.getElementById("addGraphQlEndpoint");
  const addGraphQlEndpointButton = document.getElementById(
    "addGraphQlEndpointButton"
  );
  const targetGraphQlEndpoint = document.getElementById(
    "targetGraphQlEndpoint"
  );
  const searchButton = document.getElementById("searchButton");

  if (
    !graphQlEndpoints ||
    !selectedGraphQlEndpoint ||
    !autoUpdateInterval ||
    !ellipsifyLength ||
    !selectedTheme
  ) {
    configureDefaults();
  }
  if (addGraphQlEndpoint) {
    addGraphQlEndpoint.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("addGraphQlEndpointButton").click();
      }
    });
  }
  if (addGraphQlEndpointButton) {
    addGraphQlEndpointButton.addEventListener("click", function () {
      const graphQlEndpoints = JSON.parse(
        localStorage.getItem("minaExplorerGraphQlEndpoints")
      );
      try {
        new URL(addGraphQlEndpoint.value);
      } catch (e) {
        document.getElementById("invalidUrlAlert").classList.remove("hidden");
        addGraphQlEndpoint.focus();
        return;
      }
      graphQlEndpoints.push(addGraphQlEndpoint.value);
      localStorage.setItem(
        "minaExplorerGraphQlEndpoints",
        JSON.stringify(graphQlEndpoints)
      );
      localStorage.setItem(
        "minaExplorerSelectedGraphQlEndpoint",
        addGraphQlEndpoint.value
      );
      window.location.reload();
    });
  }
  if (targetGraphQlEndpoint) {
    targetGraphQlEndpoint.addEventListener("change", function () {
      localStorage.setItem("minaExplorerSelectedGraphQlEndpoint", this.value);
      window.location.reload();
    });
  }
  if (searchButton) {
    const searchQueryElement = document.getElementById("searchQuery");
    searchQueryElement.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
      }
    });
    searchButton.addEventListener("click", function () {
      const searchQuery = searchQueryElement.value.trim();
      if (searchQuery?.length > 0) {
        const regExpTxn = /^5J[\da-zA-Z]{50}$/;
        const regExpAccount = /^[\da-zA-Z]{55}$/;
        const regExpBlockNumber = /^\d{1,50}$/;
        const regExpBlockHash = /^[\da-zA-Z]{52}$/;

        if (regExpTxn.test(searchQuery)) {
          window.location.href = `./index.html?target=transaction&hash=${searchQuery}`;
        } else if (
          regExpBlockNumber.test(searchQuery) ||
          regExpBlockHash.test(searchQuery)
        ) {
          window.location.href = `./index.html?target=block&numberOrHash=${searchQuery}`;
        } else if (regExpAccount.test(searchQuery)) {
          window.location.href = `./index.html?target=account&publicKey=${searchQuery}`;
        } else {
          renderTemplate("noPageDataTemplate", "pageContent", {
            header: "Unknown entity",
          });
        }
      } else {
        document.getElementById("searchQuery").focus();
      }
    });
  }

  configureGraphQlEndpoints();

  switch (urlSearchParams.get("target")) {
    case "block": {
      currentPage = "Block details";
      await renderBlockDetailsPage(
        urlSearchParams.get("numberOrHash"),
        "pageContent"
      );
      break;
    }
    case "account": {
      currentPage = "Accounts details";
      await renderAccountsDetailsPage(
        urlSearchParams.get("publicKey"),
        "pageContent"
      );
      break;
    }
    case "transaction": {
      currentPage = "Transaction details";
      await lookupAndRenderTransactionDetails(
        urlSearchParams.get("hash"),
        "pageContent"
      );
      break;
    }
    case "settings": {
      showSkeletonLoader("pageContent");
      await sleep();
      currentPage = "Settings";
      renderTemplate("settingsTemplate", "pageContent", {});
      refreshSettingsPage();
      addSettingsPageEventListeners();
      break;
    }
    case "daemonStatus": {
      currentPage = "Daemon Status";
      await renderDaemonStatusPage("pageContent");
      break;
    }
    default: {
      currentPage = "Home";
      renderTemplate("rootTemplate", "pageContent", {});
      break;
    }
  }

  updateBreadcrumbItems({ text: currentPage });

  // Initial recurring calls

  setTimeout(basicNetworkStateHandler, 500);
  if (document.getElementById("recentBlocksContent")) {
    setTimeout(recentBlocksHandler, 500);
  }
  if (document.getElementById("valueTransfersMempoolContent")) {
    setTimeout(valueTransfersMempoolHandler, 500);
  }
  if (document.getElementById("zkAppsMempoolContent")) {
    setTimeout(zkAppsMempoolHandler, 500);
  }

  // ---------------------
  // Function declarations
  // ---------------------

  function renderTemplate(templateId, containerId, data) {
    const template = document.getElementById(templateId).innerHTML;
    const rendered = Mustache.render(template, data);
    const container = document.getElementById(containerId);
    container.innerHTML = rendered;
  }

  function showLoader(htmlElementId) {
    const htmlElement = document.getElementById(htmlElementId);
    htmlElement.innerHTML =
      '<span class="indicator-item loading loading-spinner loading-xs text-info"></span>';
  }

  function showSkeletonLoader(htmlElementId) {
    const htmlElement = document.getElementById(htmlElementId);
    htmlElement.innerHTML = `
    <div class="flex justify-center m-10">
      <div class="card shadow-2xl bg-base-100 md:w-[60%]">
        <div class="card-body">
          <div class="flex flex-col gap-2 w-full">
            <div class="flex gap-4 items-center w-full">
              <div class="skeleton w-16 h-16 rounded-full shrink-0"></div>
              <div class="flex flex-col gap-2 w-full">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-[75%]"></div>
                <div class="skeleton h-4 w-[50%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function showNoData(htmlElementId) {
    const htmlElement = document.getElementById(htmlElementId);
    htmlElement.innerHTML =
      '<span class="text-stone-700">No data available yet</span>';
  }

  function clearInnerHtml(htmlElementId) {
    const htmlElement = document.getElementById(htmlElementId);
    htmlElement.innerHTML = "";
  }

  function sleep(ms = 1_000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function configureDefaults() {
    const defaultGraphQlEndpoints = [
      "http://localhost:8080/graphql",
      "http://localhost:3085/graphql",
      "http://localhost:4001/graphql",
      "http://localhost:4006/graphql",
      "http://localhost:5001/graphql",
      "http://localhost:6001/graphql",
    ];
    localStorage.setItem(
      "minaExplorerGraphQlEndpoints",
      JSON.stringify(defaultGraphQlEndpoints)
    );
    localStorage.setItem(
      "minaExplorerSelectedGraphQlEndpoint",
      defaultGraphQlEndpoints[0]
    );
    localStorage.setItem("minaExplorerAutoUpdateInterval", 10);
    localStorage.setItem("minaExplorerEllipsifyLength", 10);
    localStorage.setItem("minaExplorerSelectedTheme", "dark");
    window.location.reload();
  }

  function updateTheme(theme) {
    document.querySelector("html").setAttribute("data-theme", theme);
  }

  function configureGraphQlEndpoints() {
    const selectedGraphQlEndpoint = localStorage.getItem(
      "minaExplorerSelectedGraphQlEndpoint"
    );
    const graphQlEndpoints = JSON.parse(
      localStorage.getItem("minaExplorerGraphQlEndpoints")
    );
    targetGraphQlEndpoint.innerHTML = "";
    for (const graphQlEndpoint of graphQlEndpoints) {
      const option = document.createElement("option");
      option.value = graphQlEndpoint;
      option.text = graphQlEndpoint;
      if (graphQlEndpoint === selectedGraphQlEndpoint) {
        option.selected = true;
      }
      targetGraphQlEndpoint.appendChild(option);
    }
  }

  function refreshSettingsPage() {
    const psqlConnectionString = localStorage.getItem(
      "minaExplorerPsqlConnectionString"
    );
    const autoUpdateInterval = localStorage.getItem(
      "minaExplorerAutoUpdateInterval"
    );
    const ellipsifyLength = localStorage.getItem("minaExplorerEllipsifyLength");
    const selectedTheme = localStorage.getItem("minaExplorerSelectedTheme");
    const psqlConnectionStringInput = document.getElementById(
      "psqlConnectionString"
    );
    const autoUpdateIntervalInput =
      document.getElementById("autoUpdateInterval");
    const ellipsifyLengthInput = document.getElementById("ellipsifyLength");
    const themeSwitcher = document.getElementById("themeSwitcher");

    if (psqlConnectionString) {
      psqlConnectionStringInput.value = psqlConnectionString;
    }
    autoUpdateIntervalInput.value = autoUpdateInterval;
    ellipsifyLengthInput.value = ellipsifyLength;
    themeSwitcher.innerHTML = "";
    for (const theme of themes) {
      const option = document.createElement("option");
      option.value = theme;
      option.text = theme;
      if (theme === selectedTheme) {
        option.selected = true;
      }
      themeSwitcher.appendChild(option);
    }
  }

  function addSettingsPageEventListeners() {
    const psqlConnectionStringInput = document.getElementById(
      "psqlConnectionString"
    );
    const autoUpdateIntervalInput =
      document.getElementById("autoUpdateInterval");
    const ellipsifyLengthInput = document.getElementById("ellipsifyLength");
    const themeSwitcher = document.getElementById("themeSwitcher");

    psqlConnectionStringInput.addEventListener("keyup", function () {
      localStorage.setItem("minaExplorerPsqlConnectionString", this.value);
    });
    autoUpdateIntervalInput.addEventListener("change", function () {
      localStorage.setItem("minaExplorerAutoUpdateInterval", this.value);
    });
    ellipsifyLengthInput.addEventListener("change", function () {
      localStorage.setItem("minaExplorerEllipsifyLength", this.value);
    });
    themeSwitcher.addEventListener("change", function () {
      localStorage.setItem("minaExplorerSelectedTheme", this.value);
      updateTheme(this.value);
    });
  }

  function addZkAppTxnDetailsPageEventListeners() {
    const toggleLargeContent = document.getElementById("toggleLargeContent");
    if (toggleLargeContent) {
      toggleLargeContent.addEventListener("click", function () {
        const buttonText = this.innerText;
        const detailsHtmlElements = document
          .getElementById("pageContent")
          .getElementsByTagName("details");
        for (const detailsHtmlElement of detailsHtmlElements) {
          detailsHtmlElement.open = buttonText === "Expand all";
        }
        this.innerText =
          buttonText === "Expand all" ? "Collapse all" : "Expand all";
      });
    }
  }

  function updateBreadcrumbItems({
    text = "N/A",
    cssClasses = undefined,
    title = undefined,
  }) {
    const breadcrumbItem = document.createElement("li");
    const internalDiv = document.createElement("div");
    internalDiv.appendChild(document.createTextNode(text));
    if (cssClasses) {
      internalDiv.classList.add(...cssClasses);
    }
    if (title) {
      internalDiv.title = title;
    }
    breadcrumbItem.appendChild(internalDiv);
    breadcrumbs.appendChild(breadcrumbItem);
  }

  async function basicNetworkStateHandler() {
    let uptime = "N/A";
    showLoader("breadcrumbsLoader");
    await sleep();
    const basicNetworkState = await fetchGraphQlData(
      basicNetworkStateGraphQlQuery
    );
    if (basicNetworkState) {
      const map = new Map();
      map.set("Sync status", basicNetworkState.syncStatus);
      map.set(
        `Chain Id: ${basicNetworkState.daemonStatus.chainId}`,
        ellipsify(basicNetworkState.daemonStatus.chainId)
      );
      map.set(
        "Commit hash",
        basicNetworkState.daemonStatus.commitId.substring(0, 7)
      );
      map.set("K", basicNetworkState.daemonStatus.consensusConfiguration.k);
      map.set(
        "Slot duration",
        secondsToHms(
          Number(
            basicNetworkState.daemonStatus.consensusConfiguration.slotDuration
          ) / 1_000
        )
      );
      map.set(
        "Slots per epoch",
        basicNetworkState.daemonStatus.consensusConfiguration.slotsPerEpoch
      );
      uptime = basicNetworkState.daemonStatus.uptimeSecs;
      map.set(
        "Uptime",
        secondsToHms(basicNetworkState.daemonStatus.uptimeSecs)
      );
      map.set(
        "Snark work fee",
        nanoMinaToMina(basicNetworkState.daemonStatus.snarkWorkFee)
      );
      map.set("Known accounts", basicNetworkState.daemonStatus.numAccounts);
      map.set("Current page", currentPage);
      breadcrumbs.innerHTML = initialBreadcrumbsItem;
      for (const [key, value] of map.entries()) {
        if (key === "Current page") {
          updateBreadcrumbItems({ text: value, title: key });
        } else {
          updateBreadcrumbItems({
            text: value,
            cssClasses: "badge badge-primary gap-2 mr-2".split(" "),
            title: key,
          });
        }
      }
    }
    const uptimeListElement = breadcrumbs.getElementsByTagName("li")[7];
    if (uptimeListElement) {
      const targetDiv = uptimeListElement.getElementsByTagName("div")[0];
      if (uptime === "N/A") {
        targetDiv.classList.add("badge-warning");
      } else {
        targetDiv.classList.remove("badge-warning");
      }
    }
    clearInnerHtml("breadcrumbsLoader");
    setTimeout(basicNetworkStateHandler, Number(autoUpdateInterval) * 1_000);
  }

  async function recentBlocksHandler() {
    showLoader("recentBlocksContentLoader");
    await sleep();
    const recentBlocks = await fetchGraphQlData(basicRecentBlocksGraphQlQuery);
    if (recentBlocks) {
      renderTemplate("recentBlocksTemplate", "recentBlocksContent", {
        recentBlocks: recentBlocks.bestChain.reverse(),
        blocksCounter: recentBlocks.bestChain.length,
        transactionsCounter: recentBlocks.bestChain.reduce(function (
          accumulator,
          block
        ) {
          return accumulator + block.commandTransactionCount;
        },
        0),
        hashView: function () {
          return ellipsify(this.stateHash);
        },
        dateView: function () {
          return dateToLocalIsoString(this.protocolState.blockchainState.date);
        },
      });
    } else {
      showNoData("recentBlocksContent");
    }
    clearInnerHtml("recentBlocksContentLoader");
    setTimeout(recentBlocksHandler, Number(autoUpdateInterval) * 1_000);
  }

  async function valueTransfersMempoolHandler() {
    showLoader("valueTransfersMempoolContentLoader");
    await sleep();
    const valueTransfers = await fetchGraphQlData(
      valueTransfersMempoolGraphQlQuery
    );
    if (valueTransfers?.pooledUserCommands?.length > 0) {
      renderValueTransfersList(
        undefined,
        valueTransfers.pooledUserCommands,
        "valueTransfersMempoolContent"
      );
    } else {
      showNoData("valueTransfersMempoolContent");
    }
    clearInnerHtml("valueTransfersMempoolContentLoader");
    setTimeout(
      valueTransfersMempoolHandler,
      Number(autoUpdateInterval) * 1_000
    );
  }

  async function zkAppsMempoolHandler() {
    showLoader("zkAppsMempoolContentLoader");
    await sleep();
    const zkApps = await fetchGraphQlData(zkAppsMempoolGraphQlQuery);
    if (zkApps?.pooledZkappCommands?.length > 0) {
      renderZkAppsList(
        undefined,
        zkApps.pooledZkappCommands,
        "zkAppsMempoolContent"
      );
    } else {
      showNoData("zkAppsMempoolContent");
    }
    clearInnerHtml("zkAppsMempoolContentLoader");
    setTimeout(zkAppsMempoolHandler, Number(autoUpdateInterval) * 1_000);
  }

  function renderValueTransfersList(header, valueTransfers, containerId) {
    renderTemplate("valueTransfersListTemplate", containerId, {
      header,
      valueTransfers,
      txnsCounter: valueTransfers.length,
      hashView: function () {
        return ellipsify(this.hash);
      },
      feePayerView: function () {
        return ellipsify(this.feePayer.publicKey);
      },
      receiverView: function () {
        return ellipsify(this.receiver.publicKey);
      },
      amountView: function () {
        return nanoMinaToMina(this.amount);
      },
      feeView: function () {
        return nanoMinaToMina(this.fee);
      },
    });
  }

  function renderZkAppsList(header, zkApps, containerId) {
    renderTemplate("zkAppsListTemplate", containerId, {
      header,
      zkApps,
      txnsCounter: zkApps.length,
      hashView: function () {
        return ellipsify(this.hash);
      },
      feePayerView: function () {
        return ellipsify(this.zkappCommand.feePayer.body.publicKey);
      },
      feeView: function () {
        return nanoMinaToMina(this.zkappCommand.feePayer.body.fee);
      },
      ellipsisView: function () {
        return function (text, render) {
          return ellipsify(render(text));
        };
      },
    });
  }

  async function renderBlockDetailsPage(numberOrHash, containerId) {
    showSkeletonLoader(containerId);
    await sleep();
    const blockDetails = await fetchGraphQlData(
      getBlockDetailsGraphQlQuery(numberOrHash)
    );
    if (blockDetails) {
      const blockValueTransfers = blockDetails.block.transactions.userCommands;
      const blockZkApps = blockDetails.block.transactions.zkappCommands;
      const blockValueTransfersHeader = "Block value transfers";
      const blockZkAppsHeader = "Block zkApps";
      renderTemplate("blockDetailsTemplate", containerId, {
        block: blockDetails.block,
        isFirstBlock:
          Number(
            blockDetails.block.protocolState.consensusState.blockHeight
          ) === 1,
        isFeeTransferAvailable:
          blockDetails.block.transactions.feeTransfer?.length > 0,
        dateView: function () {
          return function (text, render) {
            return dateToLocalIsoString(render(text));
          };
        },
        amountView: function () {
          return function (text, render) {
            return nanoMinaToMina(render(text));
          };
        },
        ellipsisView: function () {
          return function (text, render) {
            return ellipsify(render(text));
          };
        },
      });
      if (blockValueTransfers?.length > 0) {
        renderValueTransfersList(
          blockValueTransfersHeader,
          blockValueTransfers,
          "blockValueTransfers"
        );
      } else {
        renderTemplate("noPartialDataTemplate", "blockValueTransfers", {
          header: blockValueTransfersHeader,
        });
      }
      if (blockZkApps?.length > 0) {
        renderZkAppsList(blockZkAppsHeader, blockZkApps, "blockZkApps");
      } else {
        renderTemplate("noPartialDataTemplate", "blockZkApps", {
          header: blockZkAppsHeader,
        });
      }
    } else {
      renderTemplate("noPageDataTemplate", containerId, {
        header: "Block details",
      });
    }
  }

  async function renderAccountsDetailsPage(publicKey, containerId) {
    showSkeletonLoader(containerId);
    await sleep();
    const accounts = (
      await fetchGraphQlData(getAccountsDetailsGraphQlQuery(publicKey))
    )?.accounts;
    if (accounts?.length > 0) {
      for (const account of accounts) {
        if (
          account.tokenId === minaTokenId &&
          (!account.tokenSymbol || !account.zkappUri)
        ) {
          account.tokenSymbol = "MINA";
          account.zkappUri = "https://docs.minaprotocol.com/zkapps";
        } else {
          const tokenDetails = await fetchGraphQlData(
            getTokenDetailsGraphQlQuery(account.tokenId)
          );
          if (tokenDetails.tokenOwner) {
            const tokenOwnerSymbol =
              tokenDetails.tokenOwner.tokenSymbol ?? "N/A";
            account.tokenSymbol =
              account.tokenId === minaTokenId
                ? `${tokenOwnerSymbol} (MINA)`
                : tokenOwnerSymbol;
            account.zkappUri = tokenDetails.tokenOwner.zkappUri ?? "N/A";
          } else {
            account.tokenSymbol =
              account.tokenId === minaTokenId
                ? `${account.tokenSymbol} (MINA)`
                : account.tokenSymbol;
          }
        }
        if (account.zkappState?.length > 0) {
          account.zkappState = JSON.stringify(account.zkappState, null, 2);
        }
        if (account.actionState?.length > 0) {
          account.actionState = JSON.stringify(account.actionState, null, 2);
        }
        if (account.delegators?.length > 0) {
          account.delegators = jsonAccountsToHtml(account.delegators);
        }
      }
      renderTemplate("accountsDetailsTemplate", containerId, {
        accounts,
        amountView: function () {
          return function (text, render) {
            return nanoMinaToMina(render(text));
          };
        },
        ellipsisView: function () {
          return function (text, render) {
            return ellipsify(render(text));
          };
        },
      });
    } else {
      renderTemplate("noPageDataTemplate", containerId, {
        header: "Accounts details",
      });
    }
  }

  async function renderDaemonStatusPage(containerId) {
    showSkeletonLoader(containerId);
    await sleep();
    const daemonStatus = await fetchGraphQlData(daemonStatusGraphQlQuery);
    if (daemonStatus) {
      daemonStatus.daemonStatus.consensusConfiguration.epochDuration =
        Number(daemonStatus.daemonStatus.consensusConfiguration.epochDuration) /
        1_000;
      daemonStatus.daemonStatus.consensusConfiguration.slotDuration =
        Number(daemonStatus.daemonStatus.consensusConfiguration.slotDuration) /
        1_000;
      renderTemplate("daemonStatusTemplate", containerId, {
        protocolState: daemonStatus.bestChain[0].protocolState,
        daemonStatus: daemonStatus.daemonStatus,
        runtimeConfig: daemonStatus.runtimeConfig,
        timeOffset: daemonStatus.timeOffset,
        genesisConstants: daemonStatus.genesisConstants,
        currentSnarkWorker: daemonStatus.currentSnarkWorker,
        initialPeers: daemonStatus.initialPeers,
        connectionGatingConfig: daemonStatus.connectionGatingConfig,
        blockProductionKeysExist:
          daemonStatus.daemonStatus.blockProductionKeys?.length > 0,
        isInitialPeersAvailable: daemonStatus.initialPeers?.length > 0,
        isPeersAvailable: daemonStatus.peers?.length > 0,
        isTrustedPeersAvailable:
          daemonStatus.connectionGatingConfig.trustedPeers?.length > 0,
        isBannedPeersAvailable:
          daemonStatus.connectionGatingConfig.bannedPeers?.length > 0,
        secondsToHmsView: function () {
          return function (text, render) {
            return secondsToHms(render(text));
          };
        },
        amountView: function () {
          return function (text, render) {
            return nanoMinaToMina(render(text));
          };
        },
      });
    } else {
      renderTemplate("noPageDataTemplate", containerId, {
        header: "Daemon status",
      });
    }
  }

  async function lookupAndRenderTransactionDetails(hash, containerId) {
    showSkeletonLoader(containerId);
    await sleep();
    const { data, isZkAppTxn } = await getTransactionDetails(hash);
    if (isZkAppTxn) {
      renderZkAppTxnDetailsPage(data, containerId);
      addZkAppTxnDetailsPageEventListeners();
    } else {
      renderValueTransferTxnDetailsPage(data, containerId);
    }
  }

  function renderValueTransferTxnDetailsPage(
    valueTransferDetails,
    containerId
  ) {
    if (valueTransferDetails) {
      if (valueTransferDetails.memo) {
        valueTransferDetails.memo = decodeBase58Message(
          valueTransferDetails.memo
        );
      }
      renderTemplate("valueTransferTemplate", containerId, {
        txn: valueTransferDetails,
        dateView: function () {
          return function (text, render) {
            return dateToLocalIsoString(render(text));
          };
        },
        amountView: function () {
          return function (text, render) {
            return nanoMinaToMina(render(text));
          };
        },
      });
    } else {
      renderTemplate("noPageDataTemplate", containerId, {
        header: "Transaction details",
      });
    }
  }

  function renderZkAppTxnDetailsPage(zkAppDetails, containerId) {
    if (zkAppDetails) {
      if (zkAppDetails.zkappCommand.memo) {
        zkAppDetails.zkappCommand.memo = decodeBase58Message(
          zkAppDetails.zkappCommand.memo
        );
      }
      for (
        let i = 0;
        i < zkAppDetails.zkappCommand.accountUpdates.length;
        i++
      ) {
        zkAppDetails.zkappCommand.accountUpdates[
          i
        ].accountUpdateHeader = `Account update #${i + 1}`;
        if (
          zkAppDetails.zkappCommand.accountUpdates[i].body.authorizationKind
        ) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.authorizationKind =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body
                .authorizationKind,
              null,
              2
            );
        }
        if (zkAppDetails.zkappCommand.accountUpdates[i].body.events) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.events =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body.events,
              null,
              2
            );
        }
        if (zkAppDetails.zkappCommand.accountUpdates[i].body.actions) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.actions =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body.actions,
              null,
              2
            );
        }
        if (zkAppDetails.zkappCommand.accountUpdates[i].body.preconditions) {
          zkAppDetails.zkappCommand.accountUpdates[
            i
          ].body.preconditions.account = JSON.stringify(
            zkAppDetails.zkappCommand.accountUpdates[i].body.preconditions
              .account,
            null,
            2
          );
          zkAppDetails.zkappCommand.accountUpdates[
            i
          ].body.preconditions.network = JSON.stringify(
            zkAppDetails.zkappCommand.accountUpdates[i].body.preconditions
              .network,
            null,
            2
          );
          zkAppDetails.zkappCommand.accountUpdates[
            i
          ].body.preconditions.validWhile = JSON.stringify(
            zkAppDetails.zkappCommand.accountUpdates[i].body.preconditions
              .validWhile,
            null,
            2
          );
        }
        if (zkAppDetails.zkappCommand.accountUpdates[i].body.update.appState) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.update.appState =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body.update.appState,
              null,
              2
            );
        }
        if (
          zkAppDetails.zkappCommand.accountUpdates[i].body.update.permissions
        ) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.update.permissions =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body.update
                .permissions,
              null,
              2
            );
        }
        if (zkAppDetails.zkappCommand.accountUpdates[i].body.update.timing) {
          zkAppDetails.zkappCommand.accountUpdates[i].body.update.timing =
            JSON.stringify(
              zkAppDetails.zkappCommand.accountUpdates[i].body.update.timing,
              null,
              2
            );
        }
      }
      renderTemplate("zkAppTemplate", containerId, {
        txn: zkAppDetails,
        failureReasons: zkAppDetails.failureReason,
        isFailedTxn: zkAppDetails.failureReason?.length > 0,
        dateView: function () {
          return function (text, render) {
            return dateToLocalIsoString(render(text));
          };
        },
        amountView: function () {
          return function (text, render) {
            return nanoMinaToMina(render(text));
          };
        },
      });
    } else {
      renderTemplate("noPageDataTemplate", containerId, {
        header: "Transaction details",
      });
    }
  }

  async function getTransactionDetails(hash) {
    const transactionDetails = {
      data: undefined,
      isZkAppTxn: false,
    };
    const extendedMempool = await fetchGraphQlData(extendedMempoolGraphQlQuery);
    if (extendedMempool) {
      for (const transactionData of extendedMempool.pooledUserCommands) {
        if (transactionData.hash === hash) {
          transactionDetails.data = transactionData;
          return transactionDetails;
        }
      }
      for (const transactionData of extendedMempool.pooledZkappCommands) {
        if (transactionData.hash === hash) {
          transactionDetails.data = transactionData;
          transactionDetails.isZkAppTxn = true;
          return transactionDetails;
        }
      }
    }
    const extendedRecentBlocks = await fetchGraphQlData(
      extendedRecentBlocksGraphQlQuery
    );
    if (extendedRecentBlocks) {
      for (const blockData of extendedRecentBlocks.bestChain) {
        for (const transactionData of blockData.transactions.userCommands) {
          if (transactionData.hash === hash) {
            transactionDetails.data = transactionData;
            transactionDetails.data.date =
              blockData.protocolState.blockchainState.date;
            transactionDetails.data.blockHash = blockData.stateHash;
            return transactionDetails;
          }
        }
        for (const transactionData of blockData.transactions.zkappCommands) {
          if (transactionData.hash === hash) {
            transactionDetails.data = transactionData;
            transactionDetails.isZkAppTxn = true;
            transactionDetails.data.date =
              blockData.protocolState.blockchainState.date;
            transactionDetails.data.blockHash = blockData.stateHash;
            return transactionDetails;
          }
        }
      }
    }
    return transactionDetails;
  }

  async function fetchGraphQlData(graphQlQuery) {
    const selectedGraphQlEndpoint = localStorage.getItem(
      "minaExplorerSelectedGraphQlEndpoint"
    );
    try {
      const response = await fetch(selectedGraphQlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphQlQuery),
      });
      if (!response.ok) {
        return null;
      } else {
        const responseJson = await response.json();
        if (!responseJson?.data) {
          return null;
        } else {
          return responseJson.data;
        }
      }
    } catch (_) {
      return null;
    }
  }

  function secondsToHms(seconds) {
    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor((seconds % 3600) % 60);
    let hDisplay = "";
    if (h > 0) {
      hDisplay = h + (h == 1 ? " hour, " : " hours, ");
    }
    let mDisplay = "";
    if (m > 0) {
      mDisplay = m + (m == 1 ? " minute, " : " minutes, ");
    }
    let sDisplay = "";
    if (s > 0) {
      sDisplay = s + (s == 1 ? " second" : " seconds");
    }
    const result = hDisplay + mDisplay + sDisplay;
    return result.endsWith(", ") ? result.slice(0, -2) : result;
  }

  function ellipsify(text) {
    if (text.length > ellipsifyLength) {
      return text.slice(0, ellipsifyLength) + "...";
    } else {
      return text;
    }
  }

  function dateToLocalIsoString(date) {
    const localMoment = new Date(date - timeZoneOffset);
    return localMoment.toISOString().split(".")[0];
  }

  function nanoMinaToMina(nanoMina) {
    return Number(nanoMina) / 1_000_000_000;
  }

  function jsonAccountsToHtml(accounts) {
    return accounts.map((account) => accountToHtml(account)).join("<br />");
  }

  function accountToHtml(account) {
    return `<div class="badge badge-secondary badge-outline" title="${account.publicKey}">
    <a class="link link-secondary" href="./index.html?target=account&publicKey=${account.publicKey}" target="_self">${account.publicKey}</a>
  </div>`;
  }

  function decodeBase58Message(message) {
    if (!message) {
      return "";
    }
    const decodedMessage = base(base58Alphabet).decode(message);
    const decodedString = new TextDecoder().decode(
      decodedMessage.slice(2, decodedMessage.length - 4)
    );
    return decodedString.replace(nullValueRegex, "");
  }
})();
