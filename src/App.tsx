import { AppRouter } from './routes/AppRouter';

// Root Viewport Engine — delegates all routing and RBAC enforcement
// to the AppRouter. No layout or business logic lives at this boundary.
function App() {
  return <AppRouter />;
}

export default App;
