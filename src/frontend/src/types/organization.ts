export interface OrganizationUnit extends Record<string, unknown> {
  id: number;
  name: string;
  code?: string;
  level: 'CORPORATION' | 'TOTAL_COMPANY' | 'MEMBER_COMPANY' | 'DEPARTMENT';
  parentId?: number;
  parentName?: string;
  children?: OrganizationUnit[];
}

export interface CreateOrganizationUnitRequest {
  name: string;
  code?: string;
  level: 'CORPORATION' | 'TOTAL_COMPANY' | 'MEMBER_COMPANY' | 'DEPARTMENT';
  parentId?: number;
}

export interface UpdateOrganizationUnitRequest extends Partial<CreateOrganizationUnitRequest> {}

export interface OrganizationUnitTreeNode extends OrganizationUnit {
  children: OrganizationUnitTreeNode[];
}
