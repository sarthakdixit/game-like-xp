export interface SignInScreenProps {
  onSignIn: () => void;
  error?: Error | null;
}

export function SignInScreen({ onSignIn, error }: SignInScreenProps) {
  return (
    <div data-testid="sign-in-screen">
      <h1>Chronicle</h1>
      <button type="button" onClick={onSignIn}>
        Sign in with Google
      </button>
      {error ? (
        <p role="alert" data-testid="sign-in-error">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
