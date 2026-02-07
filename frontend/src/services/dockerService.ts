import ax from "../conf/ax";

export type DeployModelPayload = {
  userId: string;
  engine: string;
  modelName: string;
};

export async function deployModel(payload: DeployModelPayload) {
  try {
    const response = await ax.post("/docker/instances", payload);
    return response.data;
  } catch (error: any) {
    console.error("Model deployment failed:", error);
    const message = error.response?.data?.error || "Model deployment failed";
    throw new Error(message);
  }
}
