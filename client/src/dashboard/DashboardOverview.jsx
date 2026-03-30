import { useAuth } from "../context/AuthContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useWishlist } from "../context/WishlistContext";
import { useWatchLater } from "../context/WatchLaterContext";
import StatCard from "../dashboard/components/StatCard";
import Trending from "./Trending";
import { useReview } from "../context/ReviewContext";
import DashboardRecommendations from "./DashboardInsights";

/**
 * DashboardOverview
 * --------------------------------------------------
 * Displays a greeting, animated stat cards, and content sections
 */
const DashboardOverview = () => {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const { historyCount } = useWatchHistory();
  const { watchLaterCount } = useWatchLater();
  const { reviewCount } = useReview();

  // Format display name from Firebase or email
  const formatEmailToName = (email) => {
    if (!email) return "User";
    const localPart = email.split("@")[0].toLowerCase();
    if (localPart === "loganlucus") return "Logan Lucas";
    if (localPart === "george") return "George";
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  const displayName =
    user?.displayName || formatEmailToName(user?.email) || "User";

  return (
    <section className="p-6 space-y-8">
      {/* Greeting */}
      <h1 className="lg:text-3xl font-bold text-[#007BFF] dark:text-blue-300">
        Welcome back, {displayName} 👋
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          label="Wishlist Items"
          count={wishlistCount}
          bgColor="bg-[#007BFF]"
          textColor="text-[#1A1A1A]"
        />
        <StatCard
          label="History Items"
          count={historyCount}
          bgColor="bg-[#E10098]"
          textColor="text-[#1A1A1A]"
        />
        <StatCard
          label="Reviews"
          count={reviewCount}
          bgColor="bg-[#FFD300]"
          textColor="text-[#1A1A1A]"
        />
        <StatCard
          label="Watchlater"
          count={watchLaterCount}
          bgColor="bg-[#FF7A00]"
          textColor="text-[#1A1A1A]"
        />
      </div>

      <hr />

      {/* Personalized Content */}
      <DashboardRecommendations/>
      <Trending />
    </section>
  );
};

export default DashboardOverview;
