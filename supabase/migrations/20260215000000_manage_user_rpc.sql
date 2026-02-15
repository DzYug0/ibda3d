-- Create a function to manage users (ban, unban, delete)
-- This replaces the edge function for better offline/local support
-- Updated to use target_user_id to avoid ambiguity with column names

DROP FUNCTION IF EXISTS public.manage_user(text, uuid, text);

CREATE OR REPLACE FUNCTION public.manage_user(
    action text,
    target_user_id uuid,
    reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    _executing_user_id uuid;
    _is_owner boolean;
BEGIN
    -- Get the ID of the user executing the function
    _executing_user_id := auth.uid();

    -- Check if the executing user is an owner
    -- We use the existing is_owner function
    SELECT public.is_owner(_executing_user_id) INTO _is_owner;

    IF NOT _is_owner THEN
        RETURN json_build_object('error', 'Only owners can perform this action');
    END IF;

    -- Protect Main Owner
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id AND email = 'molpi48@gmail.com') THEN
        RETURN json_build_object('error', 'Cannot perform actions on the Main Owner');
    END IF;

    IF action = 'delete' THEN
        -- Delete from auth.users (cascades to public.profiles if configured)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        -- Also try to delete from profiles just in case cascade isn't set up or fails
        DELETE FROM public.profiles WHERE user_id = target_user_id;

        RETURN json_build_object('success', true);
    
    ELSIF action = 'ban' THEN
        -- Ban in auth.users (set ban duration to ~100 years)
        UPDATE auth.users 
        SET banned_until = (now() + interval '100 years')
        WHERE id = target_user_id;

        -- Update profiles
        UPDATE public.profiles
        SET is_banned = true,
            banned_at = now(),
            ban_reason = reason
        WHERE user_id = target_user_id;

        RETURN json_build_object('success', true);

    ELSIF action = 'unban' THEN
        -- Unban in auth.users
        UPDATE auth.users 
        SET banned_until = NULL
        WHERE id = target_user_id;

        -- Update profiles
        UPDATE public.profiles
        SET is_banned = false,
            banned_at = NULL,
            ban_reason = NULL
        WHERE user_id = target_user_id;

        RETURN json_build_object('success', true);
        
    ELSE
        RETURN json_build_object('error', 'Invalid action');
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
