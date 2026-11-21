export interface HoleMetrics {
  actualToeRL: number;
  toeVariance: number;
  toleranceStatus: "OK" | "Hard Toe Risk" | "Over-drilled" | "Redrill";
}

export function calculateHoleMetrics(hole: {
  actualCollarRL: number;
  actualDepth: number;
  dip: number;
  targetToeRL: number;
  status: string;
}): HoleMetrics {
  const rad = (hole.dip * Math.PI) / 180;
  const actualToeRL = Number(
    (hole.actualCollarRL - hole.actualDepth * Math.sin(rad)).toFixed(2)
  );
  const toeVariance = Number((actualToeRL - hole.targetToeRL).toFixed(2));

  let toleranceStatus: HoleMetrics["toleranceStatus"] = "OK";
  if (hole.status === "Redrill Required") {
    toleranceStatus = "Redrill";
  } else if (toeVariance > 0.3) {
    // Positive variance = stopped above target Toe RL
    toleranceStatus = "Hard Toe Risk";
  } else if (toeVariance < -0.3) {
    // Negative variance = drilled too deep below target Toe RL
    toleranceStatus = "Over-drilled";
  }

  return { actualToeRL, toeVariance, toleranceStatus };
}
