export interface Branch {
  id: string;
  branchName: string;
  isMainBranch: boolean;
}

export interface BranchRequest {
  branchName: string;
  isMainBranch: boolean;
}

