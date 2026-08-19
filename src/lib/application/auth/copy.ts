/** Localized copy for the pure authentication, account, and email-link surfaces. */
export interface AuthUiCopy {
  authentication: {
    emailLabel: string;
    emailHint: string;
    passwordLabel: string;
    validationTitle: string;
    validationDescription: string;
    serviceErrorTitle: string;
    successTitle: string;
    pendingTitle: string;
    pendingTargetLabel: string;
    pendingPrivacy: string;
    submitting: string;
    journeys: {
      login: {
        submit: string;
      };
      register: {
        submit: string;
        pendingDescription: string;
      };
      reset: {
        submit: string;
        pendingDescription: string;
      };
    };
  };
  account: {
    eyebrow: string;
    title: string;
    description: string;
    loadingTitle: string;
    loadingDescription: string;
    loadErrorTitle: string;
    retry: string;
    claims: {
      title: string;
      description: string;
      userId: string;
      roles: string;
      accessExpiresAt: string;
      refreshExpiresAt: string;
      noRoles: string;
      privacyTitle: string;
      privacyDescription: string;
    };
    password: {
      title: string;
      description: string;
      currentLabel: string;
      newLabel: string;
      confirmLabel: string;
      hint: string;
      submit: string;
      submitting: string;
      validationTitle: string;
      serviceErrorTitle: string;
      successTitle: string;
    };
    email: {
      title: string;
      description: string;
      label: string;
      hint: string;
      submit: string;
      resend: string;
      submitting: string;
      validationTitle: string;
      serviceErrorTitle: string;
      pendingTitle: string;
      pendingDescription: string;
      pendingTargetLabel: string;
      pendingPrivacy: string;
      successTitle: string;
    };
    logout: {
      title: string;
      description: string;
      submit: string;
      submitting: string;
      serviceErrorTitle: string;
    };
  };
  shortCode: {
    brand: string;
    home: string;
    eyebrow: string;
    targetLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    passwordHint: string;
    submitting: string;
    validationTitle: string;
    validationDescription: string;
    serviceErrorTitle: string;
    successTitle: string;
    continue: string;
    restart: string;
    states: {
      missing: {
        title: string;
        description: string;
      };
      invalid: {
        title: string;
        description: string;
      };
      expired: {
        title: string;
        description: string;
      };
    };
    journeys: {
      register: {
        title: string;
        description: string;
        submit: string;
      };
      emailUpdate: {
        title: string;
        description: string;
        submit: string;
      };
      passwordReset: {
        title: string;
        description: string;
        submit: string;
      };
    };
  };
}
