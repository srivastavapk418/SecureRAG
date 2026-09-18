import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="screen-center">
      <div className="empty-state large">
        <h2>Page not found</h2>
        <p>The page you requested does not exist in this workspace.</p>
        <Link className="primary-button link-button" to="/">
          Return home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

