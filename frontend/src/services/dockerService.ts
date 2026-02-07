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

export async function getDeployedInstances(userId: string) {
  try {
    // แก้ไขจาก string ธรรมดาเป็น Template Literal เพื่อใส่ ID
    const response = await ax.get(`/docker/instances/user/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch user instances:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch instances");
  }
}

export async function terminateInstances(id: string) {
  try {
    // ยิง request ไปที่ backend: POST /instances/:id/terminate
    const response = await ax.post(`/docker/instances/${id}/terminate`);
    return response.data;
  } catch (error: any) {
    console.error("Terminate Error:", error);
    throw new Error(error.response?.data?.error || "Failed to terminate instances");
  }
}

export async function stopInstances(id: string) {
  try {
    const response = await ax.post(`/docker/instances/${id}/stop`);
    return response.data;
  } catch (error: any) {
    console.error("stop Error:", error);
    throw new Error(error.response?.data?.error || "Failed to stop instances");
  }
}

export async function startInstances(id: string) {
  try {
    const response = await ax.post(`/docker/instances/${id}/start`);
    return response.data;
  } catch (error: any) {
    console.error("start Error:", error);
    throw new Error(error.response?.data?.error || "Failed to start instances");
  }
}
