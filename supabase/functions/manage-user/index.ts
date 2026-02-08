import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an owner
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isOwner } = await supabaseAdmin.rpc("is_owner", { _user_id: caller.id });
    if (!isOwner) {
      console.log("Non-owner attempted manage-user:", caller.id);
      return new Response(JSON.stringify({ error: "Only owners can perform this action" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, reason } = await req.json();
    console.log(`manage-user action=${action} userId=${userId} by=${caller.id}`);

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "Missing action or userId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot perform this action on yourself" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "ban") {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      if (authErr) {
        console.error("Auth ban error:", authErr);
        throw authErr;
      }
      const { error: profileErr, data: profileData } = await supabaseAdmin.from("profiles").update({ 
        is_banned: true, 
        banned_at: new Date().toISOString(),
        ban_reason: reason || null,
      }).eq("user_id", userId).select();
      if (profileErr) {
        console.error("Profile ban update error:", profileErr);
        throw profileErr;
      }
      console.log(`User ${userId} banned. Profile updated:`, JSON.stringify(profileData));
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unban") {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (authErr) {
        console.error("Auth unban error:", authErr);
        throw authErr;
      }
      const { error: profileErr } = await supabaseAdmin.from("profiles").update({ 
        is_banned: false, 
        banned_at: null,
        ban_reason: null,
      }).eq("user_id", userId).select();
      if (profileErr) {
        console.error("Profile unban update error:", profileErr);
        throw profileErr;
      }
      console.log(`User ${userId} unbanned`);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
      console.log(`User ${userId} deleted`);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_ban") {
      // Public action to check if a user is banned (called after failed login)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_banned, ban_reason")
        .eq("email", userId) // userId here is actually the email
        .maybeSingle();

      return new Response(JSON.stringify({ 
        is_banned: profile?.is_banned || false,
        ban_reason: profile?.ban_reason || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
