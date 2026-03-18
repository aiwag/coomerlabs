import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/redgifs/')({
  component: () => <Navigate to="/redgifs/latest" />,
});
