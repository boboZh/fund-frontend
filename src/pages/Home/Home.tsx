import React, { useEffect } from "react";
import { toast } from "sonner";
const Home: React.FC = () => {
  useEffect(() => {
    toast("欢迎回来！");
  }, []);
  return (
    <div>
      Home
      <button
        className="border-1"
        onClick={() => {
          console.log("showToast");
          toast.error("asdsfsfsdf");
        }}
      >
        show Toast
      </button>
    </div>
  );
};

export default Home;
