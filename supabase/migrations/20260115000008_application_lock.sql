-- Migration: Application Lock Mechanism
-- Purpose: Enforce immutability for locked/certified applications
-- Prevents any modifications to applications, documents, or module data once certified

-- =====================================================
-- FUNCTION: Check if application is locked
-- =====================================================
CREATE OR REPLACE FUNCTION is_application_locked(app_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_status TEXT;
BEGIN
  SELECT status INTO app_status
  FROM applications
  WHERE id = app_id;

  RETURN app_status IN ('locked', 'certified');
END;
$$;

COMMENT ON FUNCTION is_application_locked IS
'Returns true if application status is locked or certified';

-- =====================================================
-- TRIGGER FUNCTION: Block updates to locked applications
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_locked_application_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if trying to update a locked application
  IF OLD.status IN ('locked', 'certified') THEN
    -- Allow specific administrative updates (e.g., adding notes)
    -- but block status changes and most field updates
    IF NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Cannot change status of locked application. Application ID: % is locked and cannot be modified.', OLD.id
        USING HINT = 'Locked applications are immutable for compliance reasons',
              ERRCODE = '23502'; -- not_null_violation (closest match)
    END IF;

    -- Block changes to critical fields
    IF NEW.applicant_name != OLD.applicant_name OR
       NEW.farm_name != OLD.farm_name OR
       NEW.program_type != OLD.program_type THEN
      RAISE EXCEPTION 'Cannot modify locked application. Application ID: % is locked and cannot be modified.', OLD.id
        USING HINT = 'Locked applications are immutable for compliance reasons',
              ERRCODE = '23502';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_locked_application_updates IS
'Trigger function that prevents updates to locked/certified applications';

-- =====================================================
-- TRIGGER: Prevent application updates when locked
-- =====================================================
DROP TRIGGER IF EXISTS prevent_locked_app_updates ON applications;

CREATE TRIGGER prevent_locked_app_updates
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_application_updates();

COMMENT ON TRIGGER prevent_locked_app_updates ON applications IS
'Enforces immutability of locked applications';

-- =====================================================
-- TRIGGER FUNCTION: Block document changes for locked apps
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_locked_app_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    IF is_application_locked(NEW.application_id) THEN
      RAISE EXCEPTION 'Cannot upload documents to locked application. Application ID: % is locked.', NEW.application_id
        USING HINT = 'Locked applications cannot accept new documents',
              ERRCODE = '23502';
    END IF;
    RETURN NEW;
  END IF;

  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    IF is_application_locked(OLD.application_id) THEN
      RAISE EXCEPTION 'Cannot modify documents in locked application. Application ID: % is locked.', OLD.application_id
        USING HINT = 'Documents in locked applications cannot be modified',
              ERRCODE = '23502';
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    IF is_application_locked(OLD.application_id) THEN
      RAISE EXCEPTION 'Cannot delete documents from locked application. Application ID: % is locked.', OLD.application_id
        USING HINT = 'Documents in locked applications cannot be deleted',
              ERRCODE = '23502';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION prevent_locked_app_document_changes IS
'Prevents document insertions, updates, and deletions for locked applications';

-- =====================================================
-- TRIGGER: Block document operations for locked apps
-- =====================================================
DROP TRIGGER IF EXISTS prevent_locked_app_documents ON documents;

CREATE TRIGGER prevent_locked_app_documents
  BEFORE INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_app_document_changes();

COMMENT ON TRIGGER prevent_locked_app_documents ON documents IS
'Prevents document modifications for locked applications';

-- =====================================================
-- TRIGGER FUNCTION: Block module data changes for locked apps
-- =====================================================
CREATE OR REPLACE FUNCTION prevent_locked_app_module_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
    IF is_application_locked(NEW.application_id) THEN
      RAISE EXCEPTION 'Cannot add module data to locked application. Application ID: % is locked.', NEW.application_id
        USING HINT = 'Locked applications cannot accept new data',
              ERRCODE = '23502';
    END IF;
    RETURN NEW;
  END IF;

  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    IF is_application_locked(OLD.application_id) THEN
      RAISE EXCEPTION 'Cannot modify module data in locked application. Application ID: % is locked.', OLD.application_id
        USING HINT = 'Module data in locked applications cannot be modified',
              ERRCODE = '23502';
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE operations
  IF TG_OP = 'DELETE' THEN
    IF is_application_locked(OLD.application_id) THEN
      RAISE EXCEPTION 'Cannot delete module data from locked application. Application ID: % is locked.', OLD.application_id
        USING HINT = 'Module data in locked applications cannot be deleted',
              ERRCODE = '23502';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION prevent_locked_app_module_changes IS
'Prevents module data insertions, updates, and deletions for locked applications';

-- =====================================================
-- TRIGGER: Block module data operations for locked apps
-- =====================================================
DROP TRIGGER IF EXISTS prevent_locked_app_modules ON module_data;

CREATE TRIGGER prevent_locked_app_modules
  BEFORE INSERT OR UPDATE OR DELETE ON module_data
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_app_module_changes();

COMMENT ON TRIGGER prevent_locked_app_modules ON module_data IS
'Prevents module data modifications for locked applications';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant execute on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION is_application_locked TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- The following queries can be used to verify the migration:
--
-- 1. Test lock check function:
--    SELECT is_application_locked('some-uuid');
--
-- 2. View all triggers:
--    SELECT trigger_name, event_object_table, action_timing, event_manipulation
--    FROM information_schema.triggers
--    WHERE trigger_schema = 'public'
--    AND trigger_name LIKE '%locked%';
--
-- 3. Test trigger (should fail):
--    -- First set an app to locked status
--    UPDATE applications SET status = 'locked' WHERE id = 'some-uuid';
--    -- Then try to update it (should fail)
--    UPDATE applications SET applicant_name = 'New Name' WHERE id = 'some-uuid';
