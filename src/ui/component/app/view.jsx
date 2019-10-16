// @flow
import * as ICONS from 'constants/icons';
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import analytics from 'analytics';
import { buildURI, parseURI } from 'lbry-redux';
import Router from 'component/router/index';
import ModalRouter from 'modal/modalRouter';
import ReactModal from 'react-modal';
import { openContextMenu } from 'util/context-menu';
import useKonamiListener from 'util/enhanced-layout';
import Yrbl from 'component/yrbl';
import FileViewer from 'component/fileViewer';
import { withRouter } from 'react-router';
import usePrevious from 'effects/use-previous';
import Button from 'component/button';

export const MAIN_WRAPPER_CLASS = 'main-wrapper';
// @if TARGET='app'
export const IS_MAC = process.platform === 'darwin';
// @endif
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 minutes

type Props = {
  alertError: (string | {}) => void,
  pageTitle: ?string,
  language: string,
  theme: string,
  user: ?{ id: string, has_verified_email: boolean, is_reward_approved: boolean },
  location: { pathname: string, hash: string },
  fetchRewards: () => void,
  fetchRewardedContent: () => void,
  fetchTransactions: () => void,
  fetchAccessToken: () => void,
  fetchChannelListMine: () => void,
  signIn: () => void,
  requestDownloadUpgrade: () => void,
  fetchChannelListMine: () => void,
  onSignedIn: () => void,
  isUpgradeAvailable: boolean,
  autoUpdateDownloaded: boolean,
  checkSync: () => void,
  syncEnabled: boolean,
};

function App(props: Props) {
  const {
    theme,
    fetchRewards,
    fetchRewardedContent,
    fetchTransactions,
    user,
    fetchAccessToken,
    fetchChannelListMine,
    signIn,
    autoUpdateDownloaded,
    isUpgradeAvailable,
    requestDownloadUpgrade,
    syncEnabled,
    checkSync,
  } = props;
  const appRef = useRef();
  const isEnhancedLayout = useKonamiListener();
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const userId = user && user.id;
  const hasVerifiedEmail = user && user.has_verified_email;
  const isRewardApproved = user && user.is_reward_approved;
  const previousUserId = usePrevious(userId);
  const previousHasVerifiedEmail = usePrevious(hasVerifiedEmail);
  const previousRewardApproved = usePrevious(isRewardApproved);
  const { pathname, hash } = props.location;
  const showUpgradeButton = autoUpdateDownloaded || (process.platform === 'linux' && isUpgradeAvailable);

  let uri;
  try {
    const newpath = buildURI(parseURI(pathname.slice(1).replace(/:/g, '#')));
    uri = newpath + hash;
  } catch (e) {}

  useEffect(() => {
    ReactModal.setAppElement(appRef.current);
    fetchAccessToken();
    fetchRewardedContent();

    // @if TARGET='app'
    fetchRewards();
    fetchTransactions();
    fetchChannelListMine(); // This needs to be done for web too...
    // @endif
  }, [fetchRewards, fetchRewardedContent, fetchTransactions, fetchAccessToken, fetchChannelListMine]);

  useEffect(() => {
    // $FlowFixMe
    document.documentElement.setAttribute('data-mode', theme);
  }, [theme]);

  useEffect(() => {
    if (previousUserId === undefined && userId) {
      analytics.setUser(userId);
    }
  }, [previousUserId, userId]);

  useEffect(() => {
    // Check that previousHasVerifiedEmail was not undefined instead of just not truthy
    // This ensures we don't fire the emailVerified event on the initial user fetch
    if (previousHasVerifiedEmail === false && hasVerifiedEmail) {
      analytics.emailVerifiedEvent();
    }
  }, [previousHasVerifiedEmail, hasVerifiedEmail, signIn]);

  useEffect(() => {
    if (previousRewardApproved === false && isRewardApproved) {
      analytics.rewardEligibleEvent();
    }
  }, [previousRewardApproved, isRewardApproved]);

  // Keep this at the end to ensure initial setup effects are run first
  useEffect(() => {
    // Wait for balance to be populated on desktop so we know when we can begin syncing
    if (!hasSignedIn && hasVerifiedEmail) {
      signIn();
      setHasSignedIn(true);
    }
  }, [hasVerifiedEmail, signIn, hasSignedIn]);

  useEffect(() => {
    if (hasVerifiedEmail && syncEnabled) {
      checkSync();

      let syncInterval = setInterval(() => {
        checkSync();
      }, SYNC_INTERVAL);

      return () => {
        clearInterval(syncInterval);
      };
    }
  }, [hasVerifiedEmail, syncEnabled, checkSync]);

  if (!user) {
    return null;
  }

  return (
    <div
      className={classnames(MAIN_WRAPPER_CLASS, {
        // @if TARGET='app'
        [`${MAIN_WRAPPER_CLASS}--mac`]: IS_MAC,
        // @endif
      })}
      ref={appRef}
      onContextMenu={e => openContextMenu(e)}
    >
      <Router />
      <ModalRouter />
      <FileViewer pageUri={uri} />

      {/* @if TARGET='app' */}
      {showUpgradeButton && (
        <div className="snack-bar--upgrade">
          {__('Upgrade is ready')}
          <Button
            className="snack-bar__action"
            button="alt"
            icon={ICONS.DOWNLOAD}
            label={__('Install now')}
            onClick={requestDownloadUpgrade}
          />
        </div>
      )}
      {/* @endif */}
      {isEnhancedLayout && <Yrbl className="yrbl--enhanced" />}
    </div>
  );
}

export default withRouter(App);
