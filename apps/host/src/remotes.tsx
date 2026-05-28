import { createRemoteAppComponent } from "@module-federation/bridge-react";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-red-600">Failed to load remote: {error.message}</p>
    </div>
  );
}

export const RemoteOneApp = createRemoteAppComponent({
  loader: () => import("remote_one/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteTwoApp = createRemoteAppComponent({
  loader: () => import("remote_two/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteVueApp = createRemoteAppComponent({
  loader: () => import("remote_vue/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteSvelteApp = createRemoteAppComponent({
  loader: () => import("remote_svelte/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});
