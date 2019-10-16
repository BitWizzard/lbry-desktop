// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import { withRouter } from 'react-router';

type Props = {
  setSyncEnabled: boolean => void,
  syncEnabled: boolean,
  verifiedEmail: ?string,
  history: { push: string => void },
  location: UrlLocation,
  getSyncError: ?string,
};

function SyncToggle(props: Props) {
  const {
    setSyncEnabled,
    syncEnabled,
    verifiedEmail,
    getSyncError,
    history,
    location: { pathname },
  } = props;

  function handleChange() {
    setSyncEnabled(!syncEnabled);
  }

  if (getSyncError) {
    return history.push(`/$/${PAGES.AUTH}?redirect=${pathname}&immediate=true`);
  }

  return (
    <div>
      {!verifiedEmail ? (
        <div>
          <Button requiresAuth button="primary" label={__('Add Email')} />
          <p className="help">{__('An email address is required to sync your account.')}</p>
        </div>
      ) : (
        <FormField
          type="checkbox"
          name="sync_toggle"
          label={__('Sync your balance and preferences accross LBRY apps.')}
          checked={syncEnabled}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

export default withRouter(SyncToggle);
