import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-gray-300 dark:text-gray-600">404</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Page not found</p>
      <Link to="/dashboard" className="mt-4">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
