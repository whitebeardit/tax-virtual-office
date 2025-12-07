import { invokeCoordinator } from "../agents/coordinator";
import { UserQueryRequest, UserQueryResponse } from "../agents/types";

export async function runUserQueryWorkflow(
  input: UserQueryRequest
): Promise<UserQueryResponse> {
  return invokeCoordinator(input);
}
