import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, getAuth } from '../../core/middleware';
import {
  GetModuleDataParamsSchema,
  UpdateFieldValueSchema,
  BulkUpdateFieldsSchema,
  ModuleDataQuerySchema,
} from './modules.schemas';
import * as ModulesService from './modules.service';

const router = Router();

/**
 * Validation middleware factory
 */
function validate<T>(schema: z.ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: result.error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    // Validation passed - data is already in req[source]
    // No need to reassign since Express already parsed it correctly
    next();
  };
}

/**
 * GET /api/modules/:applicationId/:moduleNumber
 * Get all field data for a specific module
 */
router.get(
  '/:applicationId/:moduleNumber',
  requireAuth(),
  validate(GetModuleDataParamsSchema, 'params'),
  validate(ModuleDataQuerySchema, 'query'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const { applicationId, moduleNumber } = req.params;
      const filters = req.query;

      const moduleData = await ModulesService.getModuleData(
        applicationId as string,
        moduleNumber as any as number,
        userId,
        filters
      );

      res.json({
        success: true,
        application_id: applicationId,
        module_number: moduleNumber,
        field_count: moduleData.length,
        fields: moduleData,
      });
    } catch (error) {
      console.error('Error fetching module data:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/modules/:applicationId/:moduleNumber/:fieldId
 * Get a specific field value
 */
router.get(
  '/:applicationId/:moduleNumber/:fieldId',
  requireAuth(),
  validate(GetModuleDataParamsSchema, 'params'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const { applicationId, moduleNumber, fieldId } = req.params;

      const fieldData = await ModulesService.getFieldValue(
        applicationId as string,
        moduleNumber as any as number,
        fieldId as string,
        userId
      );

      if (!fieldData) {
        res.status(404).json({
          error: 'Not found',
          message: 'Field not found'
        });
        return;
      }

      res.json({
        success: true,
        field: fieldData,
      });
    } catch (error) {
      console.error('Error fetching field value:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/modules/:applicationId/:moduleNumber/:fieldId
 * Update or create a field value
 */
router.put(
  '/:applicationId/:moduleNumber/:fieldId',
  requireAuth(),
  validate(GetModuleDataParamsSchema, 'params'),
  validate(UpdateFieldValueSchema, 'body'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const { applicationId, moduleNumber, fieldId } = req.params;
      const fieldData = req.body;

      const updated = await ModulesService.updateFieldValue(
        applicationId as string,
        moduleNumber as any as number,
        fieldId as string,
        userId,
        fieldData
      );

      res.json({
        success: true,
        message: 'Field updated successfully',
        field: updated,
      });
    } catch (error) {
      console.error('Error updating field value:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message
          });
          return;
        }

        if (error.message.includes('locked')) {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/modules/:applicationId/:moduleNumber/bulk
 * Bulk update multiple fields in a module
 */
router.post(
  '/:applicationId/:moduleNumber/bulk',
  requireAuth(),
  validate(GetModuleDataParamsSchema, 'params'),
  validate(BulkUpdateFieldsSchema, 'body'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const { applicationId, moduleNumber } = req.params;
      const bulkData = req.body;

      const result = await ModulesService.bulkUpdateFields(
        applicationId as string,
        moduleNumber as any as number,
        userId,
        bulkData
      );

      res.json({
        success: true,
        message: `Updated ${result.updated} fields`,
        updated_count: result.updated,
        fields: result.fields,
      });
    } catch (error) {
      console.error('Error bulk updating fields:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message
          });
          return;
        }

        if (error.message.includes('locked')) {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * DELETE /api/modules/:applicationId/:moduleNumber/:fieldId
 * Delete a field value
 */
router.delete(
  '/:applicationId/:moduleNumber/:fieldId',
  requireAuth(),
  validate(GetModuleDataParamsSchema, 'params'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in authentication context'
        });
        return;
      }

      const { applicationId, moduleNumber, fieldId } = req.params;

      await ModulesService.deleteFieldValue(
        applicationId as string,
        moduleNumber as any as number,
        fieldId as string,
        userId
      );

      res.json({
        success: true,
        message: 'Field deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting field value:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Not found',
            message: error.message
          });
          return;
        }

        if (error.message.includes('locked')) {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
