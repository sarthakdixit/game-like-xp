import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import type { FirestoreClient } from '@/data/firestoreClient';
import { DomainDetailScreen } from '@/features/stats/DomainDetailScreen';
import { HomeScreen } from '@/features/stats/HomeScreen';

export interface AppRoutesProps {
  uid: string;
  firestoreClientFactory?: () => FirestoreClient;
}

/**
 * Screens themselves take plain callback props (`onSelectDomain`, `onBack`)
 * rather than react-router's `useNavigate`/`useParams` directly, so they
 * stay testable without a router in the tree. This is the one place that
 * bridges them to real routing — same pattern the old React Native build
 * used for its navigation library.
 */
export function AppRoutes({ uid, firestoreClientFactory }: AppRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomeRoute uid={uid} firestoreClientFactory={firestoreClientFactory} />}
      />
      <Route
        path="/domains/:domainId"
        element={<DomainDetailRoute uid={uid} firestoreClientFactory={firestoreClientFactory} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HomeRoute({ uid, firestoreClientFactory }: AppRoutesProps) {
  const navigate = useNavigate();
  return (
    <HomeScreen
      uid={uid}
      firestoreClientFactory={firestoreClientFactory}
      onSelectDomain={(domainId) => navigate(`/domains/${domainId}`)}
    />
  );
}

function DomainDetailRoute({ uid, firestoreClientFactory }: AppRoutesProps) {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  return (
    <DomainDetailScreen
      uid={uid}
      domainId={domainId!}
      firestoreClientFactory={firestoreClientFactory}
      onBack={() => navigate('/')}
    />
  );
}
