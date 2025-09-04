import React, { useState } from "react";
import Loader1 from "./Loader1";
import Loader2 from "./Loader2";

const MergedLoader = ({ children }) => {
  const [stage, setStage] = useState("loader2"); 
  // "loader2" -> "loader1" -> "done"

  if (stage === "loader2") {
    return <Loader2 onFinish={() => setStage("loader1")} />;
  }

  if (stage === "loader1") {
    return <Loader1 onFinish={() => setStage("done")}>{children}</Loader1>;
  }

  return <>{children}</>;
};

export default MergedLoader;
