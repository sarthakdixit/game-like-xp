import './SignInScreen.css';

export interface SignInScreenProps {
  onSignIn: () => void;
  error?: Error | null;
}

export function SignInScreen({ onSignIn, error }: SignInScreenProps) {
  return (
    <div className="signInScreen" data-testid="sign-in-screen">
      <p className="prompt">Sign in to open your character sheet.</p>
      <button className="signInButton" type="button" onClick={onSignIn}>
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
