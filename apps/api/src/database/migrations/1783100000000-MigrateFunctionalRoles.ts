import { MigrationInterface, QueryRunner } from 'typeorm';

type RoleDefinition = readonly [code: string, name: string, description: string];
type PermissionDefinition = readonly [code: string, name: string, module: string, action: string];

const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  ['ADMIN', 'Administrador', 'Administración transversal de la plataforma.'],
  ['VIEWER', 'Visualizador', 'Consulta transversal y reportabilidad en modo lectura.'],
  ['INSPECTOR', 'Inspector', 'Crea y ejecuta inspecciones en terreno.'],
  ['INSPECTION_RESPONSIBLE', 'Responsable de observación', 'Ejecuta acciones correctivas y adjunta evidencias de observaciones asignadas.'],
  ['INSPECTION_CLOSURE_VERIFIER', 'Verificador de cierre de inspecciones', 'Revisa evidencias y aprueba o rechaza cierres de observaciones.'],
  ['SPR_RESPONSIBLE', 'Responsable SPR', 'Registra y envía datos mensuales SPR de su área.'],
  ['SPR_AREA_MANAGER', 'Gerente de área SPR', 'Revisa y aprueba datos SPR del área responsable.'],
  ['SPR_SUSTAINABILITY_SPECIALIST', 'Especialista de Sustentabilidad SPR', 'Valida técnicamente la consolidación y evidencias SPR.'],
  ['SPR_ENVIRONMENT_MANAGER', 'Gerente de Medio Ambiente SPR', 'Autoriza el cierre y publicación final del período SPR.'],
  ['INCIDENT_GENERATOR', 'Generador de incidentes', 'Registra incidentes, acciones inmediatas y Flash Reports.'],
  ['INCIDENT_ENV_VALIDATOR', 'Validador de Medio Ambiente', 'Valida técnicamente incidentes y Flash Reports.'],
  ['INCIDENT_ENV_COORDINATOR', 'Coordinador de Medio Ambiente', 'Coordina clasificación, seguimiento y escalamiento de incidentes.'],
  ['INCIDENT_SUPERINTENDENT', 'Superintendente de Medio Ambiente', 'Supervisa investigaciones, planes de acción y cierre de incidentes.'],
  ['INCIDENT_ICAM_LEAD', 'Líder ICAM', 'Lidera investigaciones ICAM y análisis de causa raíz.'],
  ['CONTROL_VERIFIER', 'Verificador de control crítico', 'Ejecuta verificaciones y autoevaluaciones de controles críticos.'],
  ['CONTROL_OWNER', 'Responsable de control crítico', 'Gestiona el cumplimiento y evidencias del control asignado.'],
  ['CONTROL_SUPERINTENDENT', 'Superintendente de control crítico', 'Supervisa y valida controles críticos de su ámbito.'],
  ['CONTROL_MANAGER', 'Gerente de control crítico', 'Aprueba resultados y planes de acción de controles críticos.'],
  ['CONTROL_CORPORATE_APPROVER', 'Aprobador corporativo de control crítico', 'Realiza la aprobación corporativa final de controles críticos.'],
];

const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  ['organization:read', 'Ver organización', 'organization', 'read'],
  ['users:read', 'Ver usuarios', 'users', 'read'],
  ['mobile:read', 'Ver bootstrap mobile', 'mobile', 'read'],
  ['mobile:sync', 'Sincronizar mobile', 'mobile', 'sync'],
  ['inspections:read', 'Ver inspecciones', 'inspections', 'read'],
  ['inspections:write', 'Editar inspecciones', 'inspections', 'write'],
  ['inspections:review', 'Revisar cierre de observaciones', 'inspections', 'review'],
  ['incidents:read', 'Ver incidentes', 'incidents', 'read'],
  ['incidents:write', 'Editar incidentes', 'incidents', 'write'],
  ['incidents:validate', 'Validar incidentes', 'incidents', 'validate'],
  ['incidents:coordinate', 'Coordinar incidentes', 'incidents', 'coordinate'],
  ['incidents:lead-icam', 'Liderar investigación ICAM', 'incidents', 'lead-icam'],
  ['incidents:close', 'Cerrar incidentes', 'incidents', 'close'],
  ['spr:read', 'Ver SPR', 'spr', 'read'],
  ['spr:write', 'Editar SPR', 'spr', 'write'],
  ['spr:submit', 'Enviar SPR', 'spr', 'submit'],
  ['spr:approve', 'Aprobar SPR', 'spr', 'approve'],
  ['spr:validate', 'Validar consolidación SPR', 'spr', 'validate'],
  ['spr:finalize', 'Finalizar período SPR', 'spr', 'finalize'],
  ['critical-controls:read', 'Ver controles críticos', 'critical-controls', 'read'],
  ['critical-controls:write', 'Editar controles críticos', 'critical-controls', 'write'],
  ['critical-controls:submit', 'Enviar autoevaluaciones de controles críticos', 'critical-controls', 'submit'],
  ['critical-controls:approve', 'Validar autoevaluaciones de controles críticos', 'critical-controls', 'approve'],
  ['evidences:read', 'Ver evidencias', 'evidences', 'read'],
  ['evidences:write', 'Editar evidencias', 'evidences', 'write'],
  ['evidences:validate', 'Validar evidencias', 'evidences', 'validate'],
  ['comments:read', 'Ver comentarios', 'comments', 'read'],
  ['comments:write', 'Crear comentarios', 'comments', 'write'],
  ['workflows:read', 'Ver workflows', 'workflows', 'read'],
  ['workflows:write', 'Editar workflows', 'workflows', 'write'],
  ['workflows:approve', 'Aprobar workflows', 'workflows', 'approve'],
  ['notifications:read', 'Ver notificaciones', 'notifications', 'read'],
];

const ROLE_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  VIEWER: [
    'organization:read', 'mobile:read', 'inspections:read', 'incidents:read', 'spr:read',
    'critical-controls:read', 'evidences:read', 'comments:read', 'workflows:read', 'notifications:read',
  ],
  INSPECTOR: [
    'organization:read', 'mobile:read', 'mobile:sync', 'inspections:read', 'inspections:write',
    'evidences:read', 'evidences:write', 'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  INSPECTION_RESPONSIBLE: [
    'organization:read', 'inspections:read', 'inspections:write', 'evidences:read', 'evidences:write',
    'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  INSPECTION_CLOSURE_VERIFIER: [
    'organization:read', 'users:read', 'inspections:read', 'inspections:write', 'inspections:review',
    'evidences:read', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
    'workflows:approve', 'notifications:read',
  ],
  SPR_RESPONSIBLE: [
    'organization:read', 'spr:read', 'spr:write', 'spr:submit', 'evidences:read', 'evidences:write',
    'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  SPR_AREA_MANAGER: [
    'organization:read', 'users:read', 'spr:read', 'spr:write', 'spr:submit', 'spr:approve',
    'evidences:read', 'evidences:write', 'evidences:validate', 'comments:read', 'comments:write',
    'workflows:read', 'workflows:approve', 'notifications:read',
  ],
  SPR_SUSTAINABILITY_SPECIALIST: [
    'organization:read', 'users:read', 'spr:read', 'spr:approve', 'spr:validate', 'evidences:read',
    'evidences:validate', 'comments:read', 'comments:write', 'workflows:read', 'workflows:approve', 'notifications:read',
  ],
  SPR_ENVIRONMENT_MANAGER: [
    'organization:read', 'users:read', 'spr:read', 'spr:approve', 'spr:validate', 'spr:finalize',
    'evidences:read', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
    'workflows:approve', 'notifications:read',
  ],
  INCIDENT_GENERATOR: [
    'organization:read', 'mobile:read', 'mobile:sync', 'incidents:read', 'incidents:write',
    'evidences:read', 'evidences:write', 'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  INCIDENT_ENV_VALIDATOR: [
    'organization:read', 'users:read', 'incidents:read', 'incidents:write', 'incidents:validate',
    'evidences:read', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
    'workflows:approve', 'notifications:read',
  ],
  INCIDENT_ENV_COORDINATOR: [
    'organization:read', 'users:read', 'incidents:read', 'incidents:write', 'incidents:validate',
    'incidents:coordinate', 'evidences:read', 'evidences:write', 'evidences:validate', 'comments:read',
    'comments:write', 'workflows:read', 'workflows:write', 'workflows:approve', 'notifications:read',
  ],
  INCIDENT_SUPERINTENDENT: [
    'organization:read', 'users:read', 'incidents:read', 'incidents:write', 'incidents:validate',
    'incidents:close', 'evidences:read', 'evidences:write', 'evidences:validate', 'comments:read',
    'comments:write', 'workflows:read', 'workflows:write', 'workflows:approve', 'notifications:read',
  ],
  INCIDENT_ICAM_LEAD: [
    'organization:read', 'users:read', 'incidents:read', 'incidents:write', 'incidents:lead-icam',
    'evidences:read', 'evidences:write', 'evidences:validate', 'comments:read', 'comments:write',
    'workflows:read', 'workflows:write', 'notifications:read',
  ],
  CONTROL_VERIFIER: [
    'organization:read', 'critical-controls:read', 'critical-controls:write', 'critical-controls:submit',
    'evidences:read', 'evidences:write', 'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  CONTROL_OWNER: [
    'organization:read', 'critical-controls:read', 'critical-controls:write', 'critical-controls:submit',
    'evidences:read', 'evidences:write', 'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
  ],
  CONTROL_SUPERINTENDENT: [
    'organization:read', 'users:read', 'critical-controls:read', 'critical-controls:write',
    'critical-controls:submit', 'critical-controls:approve', 'evidences:read', 'evidences:write',
    'evidences:validate', 'comments:read', 'comments:write', 'workflows:read', 'workflows:approve', 'notifications:read',
  ],
  CONTROL_MANAGER: [
    'organization:read', 'users:read', 'critical-controls:read', 'critical-controls:approve',
    'evidences:read', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
    'workflows:approve', 'notifications:read',
  ],
  CONTROL_CORPORATE_APPROVER: [
    'organization:read', 'users:read', 'critical-controls:read', 'critical-controls:approve',
    'evidences:read', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
    'workflows:approve', 'notifications:read',
  ],
};

const ACTIVE_ROLE_CODES = ROLE_DEFINITIONS.map(([code]) => code);
const NEW_ROLE_CODES = ACTIVE_ROLE_CODES.filter((code) => !['ADMIN', 'VIEWER', 'INSPECTOR'].includes(code));
const NEW_PERMISSION_CODES = [
  'inspections:review',
  'spr:validate',
  'spr:finalize',
  'incidents:validate',
  'incidents:coordinate',
  'incidents:lead-icam',
  'incidents:close',
] as const;
const PRINCIPAL_USER_CONDITION = `(
  lower(u.email) LIKE '%@goldfields.com'
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = u.company_id
      AND (c.code = 'CORP' OR c.is_contractor = false OR lower(c.name) LIKE '%gold field%')
  )
  OR EXISTS (
    SELECT 1
    FROM user_companies uc
    INNER JOIN companies c ON c.id = uc.company_id
    WHERE uc.user_id = u.id
      AND (c.code = 'CORP' OR c.is_contractor = false OR lower(c.name) LIKE '%gold field%')
  )
)`;

export class MigrateFunctionalRoles1783100000000 implements MigrationInterface {
  name = 'MigrateFunctionalRoles1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureRoles(queryRunner);
    await this.ensurePermissions(queryRunner);
    await this.rebuildFunctionalPermissionMatrix(queryRunner);
    await this.assignRolesFromDomainData(queryRunner);
    await this.assignRolesFromLegacyRoles(queryRunner);
    await this.assignRolesFromExplicitPositions(queryRunner);
    await this.remapWorkflowRoles(queryRunner);

    await queryRunner.query(`
      DELETE FROM user_roles
      WHERE role_id IN (SELECT id FROM roles WHERE code IN ('SUPERVISOR', 'APPROVER'))
    `);
    await queryRunner.query(`
      UPDATE roles
      SET is_active = false,
          description = 'Rol legado reemplazado por roles funcionales por módulo.',
          updated_at = now()
      WHERE code IN ('SUPERVISOR', 'APPROVER')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles
      SET is_active = true, description = NULL, updated_at = now()
      WHERE code IN ('SUPERVISOR', 'APPROVER')
    `);

    await this.assignUsersFromRoles(queryRunner, 'SUPERVISOR', [
      'INSPECTION_CLOSURE_VERIFIER', 'SPR_AREA_MANAGER', 'INCIDENT_SUPERINTENDENT', 'CONTROL_SUPERINTENDENT',
    ]);
    await this.assignUsersFromRoles(queryRunner, 'APPROVER', [
      'SPR_SUSTAINABILITY_SPECIALIST', 'SPR_ENVIRONMENT_MANAGER', 'INCIDENT_ENV_VALIDATOR',
      'INCIDENT_ENV_COORDINATOR', 'CONTROL_MANAGER', 'CONTROL_CORPORATE_APPROVER',
    ]);
    await this.remapWorkflowRolesToLegacy(queryRunner);

    const affectedCodes = [...ACTIVE_ROLE_CODES, 'SUPERVISOR', 'APPROVER'];
    await queryRunner.query(
      `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE code = ANY($1::text[]))`,
      [affectedCodes],
    );
    await queryRunner.query(
      `DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE code = ANY($1::text[]))`,
      [NEW_ROLE_CODES],
    );
    await queryRunner.query(
      `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE code = ANY($1::text[]))`,
      [NEW_ROLE_CODES],
    );
    await queryRunner.query(`DELETE FROM roles WHERE code = ANY($1::text[])`, [NEW_ROLE_CODES]);
    await queryRunner.query(
      `DELETE FROM role_permissions
       WHERE permission_id IN (SELECT id FROM permissions WHERE code = ANY($1::text[]))`,
      [NEW_PERMISSION_CODES],
    );
    await queryRunner.query(`DELETE FROM permissions WHERE code = ANY($1::text[])`, [NEW_PERMISSION_CODES]);

    const legacyMatrix: Readonly<Record<string, readonly string[]>> = {
      SUPERVISOR: [
        'organization:read', 'users:read', 'mobile:read', 'mobile:sync', 'inspections:read', 'inspections:write',
        'incidents:read', 'incidents:write', 'spr:read', 'spr:write', 'spr:submit', 'spr:approve',
        'critical-controls:read', 'critical-controls:write', 'critical-controls:submit', 'evidences:read',
        'evidences:write', 'evidences:validate', 'comments:read', 'comments:write', 'workflows:read',
        'workflows:write', 'workflows:approve', 'notifications:read',
      ],
      INSPECTOR: [
        'organization:read', 'mobile:read', 'mobile:sync', 'inspections:read', 'inspections:write',
        'incidents:read', 'incidents:write', 'spr:read', 'spr:write', 'spr:submit', 'critical-controls:read',
        'critical-controls:write', 'critical-controls:submit', 'evidences:read', 'evidences:write',
        'comments:read', 'comments:write', 'workflows:read', 'notifications:read',
      ],
      APPROVER: [
        'organization:read', 'users:read', 'mobile:read', 'inspections:read', 'incidents:read', 'spr:read',
        'spr:approve', 'critical-controls:read', 'critical-controls:approve', 'evidences:read',
        'evidences:validate', 'comments:read', 'comments:write', 'workflows:read', 'workflows:approve', 'notifications:read',
      ],
      VIEWER: ROLE_PERMISSIONS.VIEWER,
    };

    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'ADMIN'
      ON CONFLICT DO NOTHING
    `);
    await this.assignPermissionMatrix(queryRunner, legacyMatrix);
  }

  private async ensureRoles(queryRunner: QueryRunner): Promise<void> {
    for (const [code, name, description] of ROLE_DEFINITIONS) {
      await queryRunner.query(
        `INSERT INTO roles (code, name, description, is_system, is_active)
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             is_system = true,
             is_active = true,
             updated_at = now()`,
        [code, name, description],
      );
    }
  }

  private async ensurePermissions(queryRunner: QueryRunner): Promise<void> {
    for (const [code, name, module, action] of PERMISSION_DEFINITIONS) {
      await queryRunner.query(
        `INSERT INTO permissions (code, name, module, action)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             module = EXCLUDED.module,
             action = EXCLUDED.action`,
        [code, name, module, action],
      );
    }
  }

  private async rebuildFunctionalPermissionMatrix(queryRunner: QueryRunner): Promise<void> {
    const affectedCodes = [...ACTIVE_ROLE_CODES, 'SUPERVISOR', 'APPROVER'];
    await queryRunner.query(
      `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE code = ANY($1::text[]))`,
      [affectedCodes],
    );
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'ADMIN'
      ON CONFLICT DO NOTHING
    `);
    await this.assignPermissionMatrix(queryRunner, ROLE_PERMISSIONS);
  }

  private async assignPermissionMatrix(
    queryRunner: QueryRunner,
    matrix: Readonly<Record<string, readonly string[]>>,
  ): Promise<void> {
    for (const [roleCode, permissionCodes] of Object.entries(matrix)) {
      await queryRunner.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id
         FROM roles r, permissions p
         WHERE r.code = $1
           AND p.code = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [roleCode, permissionCodes],
      );
    }
  }

  private async assignRolesFromDomainData(queryRunner: QueryRunner): Promise<void> {
    await this.assignUsersFromSelect(queryRunner, 'INSPECTOR', `
      SELECT inspector_user_id AS user_id
      FROM inspections
      WHERE inspector_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'INSPECTION_RESPONSIBLE', `
      SELECT owner_user_id AS user_id FROM inspection_findings WHERE owner_user_id IS NOT NULL
      UNION
      SELECT executed_by_user_id FROM inspection_findings WHERE executed_by_user_id IS NOT NULL
      UNION
      SELECT user_id FROM inspection_finding_responsibles
    `);
    await this.assignUsersFromSelect(queryRunner, 'SPR_RESPONSIBLE', `
      SELECT responsible_user_id AS user_id
      FROM spr_parameter_area_assignments
      WHERE responsible_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'SPR_AREA_MANAGER', `
      SELECT approver_user_id AS user_id
      FROM spr_parameter_area_assignments
      WHERE approver_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'INCIDENT_GENERATOR', `
      SELECT reported_by_user_id AS user_id
      FROM incidents
      WHERE reported_by_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'INCIDENT_ENV_VALIDATOR', `
      SELECT validator_user_id AS user_id
      FROM incident_validations
      WHERE validator_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'INCIDENT_ICAM_LEAD', `
      SELECT lead_user_id AS user_id
      FROM incident_investigations
      WHERE lead_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'CONTROL_OWNER', `
      SELECT responsible_user_id AS user_id
      FROM control_area_assignments
      WHERE responsible_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'CONTROL_VERIFIER', `
      SELECT created_by_user_id AS user_id FROM control_self_assessments WHERE created_by_user_id IS NOT NULL
      UNION
      SELECT submitted_by_user_id FROM control_self_assessments WHERE submitted_by_user_id IS NOT NULL
    `);
    await this.assignUsersFromSelect(queryRunner, 'CONTROL_SUPERINTENDENT', `
      SELECT validated_by_user_id AS user_id
      FROM control_self_assessments
      WHERE validated_by_user_id IS NOT NULL
    `);
  }

  private async assignRolesFromLegacyRoles(queryRunner: QueryRunner): Promise<void> {
    for (const targetRole of ['SPR_RESPONSIBLE', 'INCIDENT_GENERATOR', 'CONTROL_VERIFIER']) {
      await this.assignLegacyUsers(queryRunner, 'INSPECTOR', targetRole);
    }
    await this.assignLegacyUsers(queryRunner, 'INSPECTOR', 'INSPECTION_CLOSURE_VERIFIER', PRINCIPAL_USER_CONDITION);
    await this.assignLegacyUsers(queryRunner, 'INSPECTOR', 'INSPECTION_RESPONSIBLE', `NOT ${PRINCIPAL_USER_CONDITION}`);

    for (const targetRole of ['INSPECTOR', 'SPR_AREA_MANAGER', 'INCIDENT_SUPERINTENDENT', 'CONTROL_SUPERINTENDENT']) {
      await this.assignLegacyUsers(queryRunner, 'SUPERVISOR', targetRole);
    }
    await this.assignLegacyUsers(queryRunner, 'SUPERVISOR', 'INSPECTION_CLOSURE_VERIFIER', PRINCIPAL_USER_CONDITION);
    await this.assignLegacyUsers(queryRunner, 'SUPERVISOR', 'INSPECTION_RESPONSIBLE', `NOT ${PRINCIPAL_USER_CONDITION}`);

    for (const targetRole of ['SPR_SUSTAINABILITY_SPECIALIST', 'INCIDENT_ENV_VALIDATOR', 'CONTROL_CORPORATE_APPROVER']) {
      await this.assignLegacyUsers(queryRunner, 'APPROVER', targetRole);
    }
  }

  private async assignRolesFromExplicitPositions(queryRunner: QueryRunner): Promise<void> {
    await this.assignUsersByPosition(queryRunner, 'SPR_SUSTAINABILITY_SPECIALIST', ['%especialista%sustent%', '%especialista%ambient%']);
    await this.assignUsersByPosition(queryRunner, 'SPR_ENVIRONMENT_MANAGER', ['%gerente%medio ambiente%', '%environment manager%']);
    await this.assignUsersByPosition(queryRunner, 'INCIDENT_ENV_COORDINATOR', ['%coordinador%medio ambiente%', '%environment coordinator%']);
    await this.assignUsersByPosition(queryRunner, 'INCIDENT_SUPERINTENDENT', ['%superintendente%medio ambiente%', '%environment superintendent%']);
    await this.assignUsersByPosition(queryRunner, 'INCIDENT_ICAM_LEAD', ['%icam%']);
  }

  private async assignLegacyUsers(
    queryRunner: QueryRunner,
    legacyRoleCode: string,
    targetRoleCode: string,
    condition = 'TRUE',
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT DISTINCT ur.user_id, target.id
       FROM user_roles ur
       INNER JOIN roles legacy ON legacy.id = ur.role_id
       INNER JOIN users u ON u.id = ur.user_id AND u.is_active = true
       CROSS JOIN roles target
       WHERE legacy.code = $1
         AND target.code = $2
         AND target.is_active = true
         AND (${condition})
       ON CONFLICT DO NOTHING`,
      [legacyRoleCode, targetRoleCode],
    );
  }

  private async assignUsersFromSelect(
    queryRunner: QueryRunner,
    targetRoleCode: string,
    sourceSql: string,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT DISTINCT source.user_id, role.id
       FROM (${sourceSql}) source
       INNER JOIN users u ON u.id = source.user_id AND u.is_active = true
       CROSS JOIN roles role
       WHERE source.user_id IS NOT NULL
         AND role.code = $1
         AND role.is_active = true
       ON CONFLICT DO NOTHING`,
      [targetRoleCode],
    );
  }

  private async assignUsersByPosition(
    queryRunner: QueryRunner,
    targetRoleCode: string,
    patterns: readonly string[],
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT u.id, role.id
       FROM users u
       CROSS JOIN roles role
       WHERE u.is_active = true
         AND role.code = $1
         AND role.is_active = true
         AND lower(COALESCE(u.position, '')) LIKE ANY($2::text[])
       ON CONFLICT DO NOTHING`,
      [targetRoleCode, patterns],
    );
  }

  private async assignUsersFromRoles(
    queryRunner: QueryRunner,
    targetRoleCode: string,
    sourceRoleCodes: readonly string[],
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT DISTINCT source.user_id, target.id
       FROM user_roles source
       INNER JOIN roles source_role ON source_role.id = source.role_id
       CROSS JOIN roles target
       WHERE source_role.code = ANY($1::text[])
         AND target.code = $2
       ON CONFLICT DO NOTHING`,
      [sourceRoleCodes, targetRoleCode],
    );
  }

  private async remapWorkflowRoles(queryRunner: QueryRunner): Promise<void> {
    await this.remapWorkflowDefinitionRole(queryRunner, 'SUPERVISOR', {
      inspection: 'INSPECTION_CLOSURE_VERIFIER', incident: 'INCIDENT_SUPERINTENDENT',
      spr: 'SPR_AREA_MANAGER', control: 'CONTROL_SUPERINTENDENT',
    });
    await this.remapWorkflowDefinitionRole(queryRunner, 'APPROVER', {
      inspection: 'INSPECTION_CLOSURE_VERIFIER', incident: 'INCIDENT_ENV_VALIDATOR',
      spr: 'SPR_SUSTAINABILITY_SPECIALIST', control: 'CONTROL_CORPORATE_APPROVER',
    });
    await this.remapWorkflowInstanceRole(queryRunner, 'SUPERVISOR', {
      inspection: 'INSPECTION_CLOSURE_VERIFIER', incident: 'INCIDENT_SUPERINTENDENT',
      spr: 'SPR_AREA_MANAGER', control: 'CONTROL_SUPERINTENDENT',
    });
    await this.remapWorkflowInstanceRole(queryRunner, 'APPROVER', {
      inspection: 'INSPECTION_CLOSURE_VERIFIER', incident: 'INCIDENT_ENV_VALIDATOR',
      spr: 'SPR_SUSTAINABILITY_SPECIALIST', control: 'CONTROL_CORPORATE_APPROVER',
    });
  }

  private async remapWorkflowRolesToLegacy(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE workflow_definition_steps step
      SET required_role_id = legacy.id, updated_at = now()
      FROM roles current_role, roles legacy
      WHERE step.required_role_id = current_role.id
        AND current_role.code IN ('INSPECTION_CLOSURE_VERIFIER', 'SPR_AREA_MANAGER', 'INCIDENT_SUPERINTENDENT', 'CONTROL_SUPERINTENDENT')
        AND legacy.code = 'SUPERVISOR'
    `);
    await queryRunner.query(`
      UPDATE workflow_definition_steps step
      SET required_role_id = legacy.id, updated_at = now()
      FROM roles current_role, roles legacy
      WHERE step.required_role_id = current_role.id
        AND current_role.code IN ('SPR_SUSTAINABILITY_SPECIALIST', 'SPR_ENVIRONMENT_MANAGER', 'INCIDENT_ENV_VALIDATOR', 'INCIDENT_ENV_COORDINATOR', 'CONTROL_MANAGER', 'CONTROL_CORPORATE_APPROVER')
        AND legacy.code = 'APPROVER'
    `);
    await queryRunner.query(`
      UPDATE workflow_instance_steps step
      SET assigned_role_id = legacy.id, updated_at = now()
      FROM roles current_role, roles legacy
      WHERE step.assigned_role_id = current_role.id
        AND current_role.code IN ('INSPECTION_CLOSURE_VERIFIER', 'SPR_AREA_MANAGER', 'INCIDENT_SUPERINTENDENT', 'CONTROL_SUPERINTENDENT')
        AND legacy.code = 'SUPERVISOR'
    `);
    await queryRunner.query(`
      UPDATE workflow_instance_steps step
      SET assigned_role_id = legacy.id, updated_at = now()
      FROM roles current_role, roles legacy
      WHERE step.assigned_role_id = current_role.id
        AND current_role.code IN ('SPR_SUSTAINABILITY_SPECIALIST', 'SPR_ENVIRONMENT_MANAGER', 'INCIDENT_ENV_VALIDATOR', 'INCIDENT_ENV_COORDINATOR', 'CONTROL_MANAGER', 'CONTROL_CORPORATE_APPROVER')
        AND legacy.code = 'APPROVER'
    `);
  }

  private async remapWorkflowDefinitionRole(
    queryRunner: QueryRunner,
    legacyCode: string,
    targets: Readonly<Record<'inspection' | 'incident' | 'spr' | 'control', string>>,
  ): Promise<void> {
    await queryRunner.query(
      `UPDATE workflow_definition_steps step
       SET required_role_id = target.id, updated_at = now()
       FROM workflow_definitions definition, roles legacy, roles target
       WHERE step.workflow_definition_id = definition.id
         AND step.required_role_id = legacy.id
         AND legacy.code = $1
         AND target.code = CASE
           WHEN lower(definition.entity_type) LIKE 'inspection%' THEN $2
           WHEN lower(definition.entity_type) LIKE 'incident%' THEN $3
           WHEN lower(definition.entity_type) LIKE 'spr%' THEN $4
           WHEN lower(definition.entity_type) LIKE '%control%' OR lower(definition.entity_type) LIKE 'mue%' THEN $5
           ELSE NULL
         END`,
      [legacyCode, targets.inspection, targets.incident, targets.spr, targets.control],
    );
  }

  private async remapWorkflowInstanceRole(
    queryRunner: QueryRunner,
    legacyCode: string,
    targets: Readonly<Record<'inspection' | 'incident' | 'spr' | 'control', string>>,
  ): Promise<void> {
    await queryRunner.query(
      `UPDATE workflow_instance_steps step
       SET assigned_role_id = target.id, updated_at = now()
       FROM workflow_instances instance, roles legacy, roles target
       WHERE step.workflow_instance_id = instance.id
         AND step.assigned_role_id = legacy.id
         AND legacy.code = $1
         AND target.code = CASE
           WHEN lower(instance.entity_type) LIKE 'inspection%' THEN $2
           WHEN lower(instance.entity_type) LIKE 'incident%' THEN $3
           WHEN lower(instance.entity_type) LIKE 'spr%' THEN $4
           WHEN lower(instance.entity_type) LIKE '%control%' OR lower(instance.entity_type) LIKE 'mue%' THEN $5
           ELSE NULL
         END`,
      [legacyCode, targets.inspection, targets.incident, targets.spr, targets.control],
    );
  }
}
