/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { API_BASE_URL } from "../../../api";

// Register Chart.js components and plugins
ChartJS.register(ArcElement, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler, ChartDataLabels);

// Component for displaying statistical dashboards with pie, bar, and line charts
export default function AdminAnalytics() {
  // State for user data, filters, UI, and chart types
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("pie"); // pie or bar for upper charts
  const [registrationTimeFilter, setRegistrationTimeFilter] = useState("all"); // filter for bar chart
  const [cumulativeTimeFilter, setCumulativeTimeFilter] = useState("all"); // filter for line chart

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          // Validate and filter users with valid createdAt
          const validUsers = data.users.filter((user) => {
            if (!user.createdAt || isNaN(new Date(user.createdAt).getTime())) {
              return false;
            }
            return true;
          });
          setUsers(validUsers);
          setError(null);
        } else {
          throw new Error(data.message || "Failed to fetch users");
        }
      } catch (error) {
        setError(error.message || "Failed to load statistics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Calculate user type distribution
  const userTypeCounts = {
    patients: users.filter((user) => 
      user.user_type && user.user_type.toLowerCase() === "patient"
    ).length,
    healthcare: users.filter((user) => 
      user.user_type && user.user_type.toLowerCase() === "healthcare"
    ).length,
  };

  const userTypePieData = {
    labels: ["Patients", "Healthcare"],
    datasets: [
      {
        data: [userTypeCounts.patients, userTypeCounts.healthcare],
        backgroundColor: ["#4285F4", "#34D399"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const userTypeBarData = {
    labels: ["Patients", "Healthcare"],
    datasets: [
      {
        label: "User Count",
        data: [userTypeCounts.patients, userTypeCounts.healthcare],
        backgroundColor: ["#4285F4", "#34D399"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  // Calculate healthcare type distribution
  const healthcareTypeCounts = {
    doctors: users.filter(
      (user) => user.user_type && user.user_type.toLowerCase() === "healthcare" && user.healthcare_type === "doctor"
    ).length,
    nurses: users.filter(
      (user) => user.user_type && user.user_type.toLowerCase() === "healthcare" && user.healthcare_type === "nurse"
    ).length,
    pharmacists: users.filter(
      (user) => user.user_type && user.user_type.toLowerCase() === "healthcare" && user.healthcare_type === "pharmacy"
    ).length,
    laboratories: users.filter(
      (user) => user.user_type && user.user_type.toLowerCase() === "healthcare" && user.healthcare_type === "laboratory"
    ).length,
  };

  const healthcareTypePieData = {
    labels: ["Doctors", "Nurses", "Pharmacists", "Laboratories"],
    datasets: [
      {
        data: [
          healthcareTypeCounts.doctors,
          healthcareTypeCounts.nurses,
          healthcareTypeCounts.pharmacists,
          healthcareTypeCounts.laboratories,
        ],
        backgroundColor: ["#4285F4", "#34D399", "#FBBF24", "#F87171", "#A1A1AA"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const healthcareTypeBarData = {
    labels: ["Doctors", "Nurses", "Pharmacists", "Laboratories"],
    datasets: [
      {
        label: "Healthcare Type Count",
        data: [
          healthcareTypeCounts.doctors,
          healthcareTypeCounts.nurses,
          healthcareTypeCounts.pharmacists,
          healthcareTypeCounts.laboratories,
        ],
        backgroundColor: ["#4285F4", "#34D399", "#FBBF24", "#F87171", "#A1A1AA"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  // Calculate user registrations over time (bar chart)
  const getRegistrationData = () => {
    const now = new Date();
    let labels = [];
    let data = [];

    if (registrationTimeFilter === "week") {
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        return date.toLocaleDateString("en-US", { weekday: "short" });
      });
      data = labels.map((_, i) => {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (6 - i));
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        return users.filter((user) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt < endDate;
        }).length;
      });
    } else if (registrationTimeFilter === "month") {
      labels = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
      data = labels.map((_, i) => {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - (28 - i * 7));
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        return users.filter((user) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt < endDate;
        }).length;
      });
    } else if (registrationTimeFilter === "year") {
      labels = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("en-US", { month: "short" })
      );
      data = labels.map((_, i) => {
        const startDate = new Date(now.getFullYear(), i, 1);
        const endDate = new Date(now.getFullYear(), i + 1, 1);
        return users.filter((user) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt < endDate;
        }).length;
      });
    } else {
      // All time: group by year
      const years = [...new Set(users.map((user) => new Date(user.createdAt).getFullYear()))].sort();
      labels = years.map((year) => year.toString());
      data = years.map((year) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        return users.filter((user) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt < endDate;
        }).length;
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "New Users",
          data,
          backgroundColor: "#4285F4",
          borderColor: "#ffffff",
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate cumulative user increase over time (line chart)
  const getCumulativeUserData = () => {
    if (users.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "Cumulative Users",
            data: [],
            borderColor: "#34D399",
            backgroundColor: "rgba(52, 211, 153, 0.2)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#34D399",
            pointBorderColor: "#ffffff",
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: "#34D399",
          },
        ],
      };
    }

    // Sort users by createdAt for chronological order
    const sortedUsers = [...users].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const now = new Date();
    let labels = [];
    let data = [];

    if (cumulativeTimeFilter === "week") {
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        return date.toLocaleDateString("en-US", { weekday: "short" });
      });
      data = labels.map((_, i) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (6 - i));
        endDate.setHours(23, 59, 59, 999);
        return sortedUsers.filter((user) => new Date(user.createdAt) <= endDate).length;
      });
    } else if (cumulativeTimeFilter === "month") {
      labels = Array.from({ length: 4 }, (_, i) => `Week ${i + 1}`);
      data = labels.map((_, i) => {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - (28 - i * 7));
        endDate.setHours(23, 59, 59, 999);
        return sortedUsers.filter((user) => new Date(user.createdAt) <= endDate).length;
      });
    } else if (cumulativeTimeFilter === "year") {
      labels = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("en-US", { month: "short" })
      );
      data = labels.map((_, i) => {
        const endDate = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);
        return sortedUsers.filter((user) => new Date(user.createdAt) <= endDate).length;
      });
    } else {
      // All time: group by year
      const years = [...new Set(users.map((user) => new Date(user.createdAt).getFullYear()))].sort();
      labels = years.map((year) => year.toString());
      data = years.map((year) => {
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        return sortedUsers.filter((user) => new Date(user.createdAt) <= endDate).length;
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "Cumulative Users",
          data,
          borderColor: "#34D399",
          backgroundColor: "rgba(52, 211, 153, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#34D399",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#34D399",
        },
      ],
    };
  };

  // Chart options for pie charts
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: "600",
          },
          color: "#1F2937",
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // Chart options for bar charts
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
      },
      datalabels: {
        display: true,
        color: "#1F2937",
        font: { size: 12, family: "'Inter', sans-serif", weight: "bold" },
        anchor: "end",
        align: "top",
        formatter: (value) => value,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif", weight: "500" },
          color: "#1F2937",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif", weight: "500" },
          color: "#1F2937",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Chart options for line charts
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14, family: "'Inter', sans-serif", weight: "600" },
          color: "#1F2937",
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif", weight: "500" },
          color: "#1F2937",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          font: { size: 12, family: "'Inter', sans-serif", weight: "500" },
          color: "#1F2937",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-[#4285F4] mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div className="text-[#4285F4] text-2xl font-semibold">
            Loading statistics...
          </div>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="text-[#F87171] text-xl font-semibold bg-white p-6 rounded-lg shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#4285F4] mb-8 text-center sm:text-left">
          Statistics
        </h2>
        <div className="space-y-10">
          {/* Container for the two pie/bar charts side by side */}
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-6 sm:space-y-0">
            {/* User Type Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1F2937]">User Type Distribution</h3>
                <button
                  onClick={() => setChartType(chartType === "pie" ? "bar" : "pie")}
                  className="mt-4 sm:mt-0 cursor-pointer px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-[#3267D6] transition-all duration-300 font-semibold shadow-md"
                >
                  Switch to {chartType === "pie" ? "Bar" : "Pie"}
                </button>
              </div>
              <div className="flex justify-center transition-opacity duration-500">
                <div className="w-full max-w-[500px] h-[250px] sm:h-[350px]">
                  {chartType === "pie" ? (
                    <Pie data={userTypePieData} options={pieChartOptions} />
                  ) : (
                    <Bar data={userTypeBarData} options={barChartOptions} />
                  )}
                </div>
              </div>
            </div>

            {/* Healthcare Type Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1F2937]">Healthcare Type Distribution</h3>
                <button
                  onClick={() => setChartType(chartType === "pie" ? "bar" : "pie")}
                  className="mt-4 sm:mt-0 cursor-pointer px-4 py-2 bg-[#4285F4] text-white rounded-lg hover:bg-[#3267D6] transition-all duration-300 font-semibold shadow-md"
                >
                  Switch to {chartType === "pie" ? "Bar" : "Pie"}
                </button>
              </div>
              <div className="flex justify-center transition-opacity duration-500">
                <div className="w-full max-w-[500px] h-[250px] sm:h-[350px]">
                  {chartType === "pie" ? (
                    <Pie data={healthcareTypePieData} options={pieChartOptions} />
                  ) : (
                    <Bar data={healthcareTypeBarData} options={barChartOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Registration Over Time Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#1F2937]">User Registrations Over Time</h3>
              <select
                value={registrationTimeFilter}
                onChange={(e) => setRegistrationTimeFilter(e.target.value)}
                className="mt-4 sm:mt-0 cursor-pointer p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 text-gray-700"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="w-full h-[350px] sm:h-[450px]">
              <Bar data={getRegistrationData()} options={barChartOptions} />
            </div>
          </div>

          {/* Cumulative User Increase Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#1F2937]">Cumulative User Growth</h3>
              <select
                value={cumulativeTimeFilter}
                onChange={(e) => setCumulativeTimeFilter(e.target.value)}
                className="mt-4 sm:mt-0 cursor-pointer p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 text-gray-700"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="w-full h-[350px] sm:h-[450px]">
              <Line data={getCumulativeUserData()} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}