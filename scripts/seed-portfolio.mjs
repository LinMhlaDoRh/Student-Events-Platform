import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_PASSWORD are required.',
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminEmail = 'mlindosi06@gmail.com';

const suggestions = [
  {
    text: 'Host a student coding showcase where students can present their projects and meet local employers.',
    campus: 'musgrave',
    category: 'academic',
    clusterLabel: 'Career and Technology',
    status: 'considering',
  },
  {
    text: 'Organise an intercampus football and netball day for Musgrave and uMhlanga students.',
    campus: 'umhlanga',
    category: 'sports',
    clusterLabel: 'Campus Sports',
    status: 'review',
  },
  {
    text: 'Run a mental wellness workshop focused on managing academic pressure and preventing burnout.',
    campus: 'musgrave',
    category: 'academic',
    clusterLabel: 'Student Wellness',
    status: 'considering',
  },
  {
    text: 'Plan a cultural food and music festival where students can celebrate different backgrounds.',
    campus: 'umhlanga',
    category: 'cultural',
    clusterLabel: 'Culture and Community',
    status: 'review',
  },
  {
    text: 'Offer an exam preparation session covering study methods, time management and revision planning.',
    campus: 'musgrave',
    category: 'academic',
    clusterLabel: 'Academic Support',
    status: 'considering',
  },
  {
    text: 'Arrange a beach cleanup followed by a student picnic and community networking session.',
    campus: 'umhlanga',
    category: 'social',
    clusterLabel: 'Community Activities',
    status: 'review',
  },
  {
    text: 'Host a student entrepreneurship pitch evening with feedback from local business owners.',
    campus: 'musgrave',
    category: 'academic',
    clusterLabel: 'Career and Technology',
    status: 'review',
  },
  {
    text: 'Plan a games evening with board games, quizzes and friendly campus competitions.',
    campus: 'umhlanga',
    category: 'social',
    clusterLabel: null,
    status: 'submitted',
  },
  {
    text: 'Invite graduates and junior professionals to speak about entering the technology industry.',
    campus: 'musgrave',
    category: 'academic',
    clusterLabel: null,
    status: 'submitted',
  },
  {
    text: 'Organise a campus photography walk and creative exhibition for student photographers.',
    campus: 'umhlanga',
    category: 'cultural',
    clusterLabel: null,
    status: 'submitted',
  },
];

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) return match;
    if (data.users.length < 100) return null;
  }

  return null;
}

async function ensureAdmin() {
  let user = await findUserByEmail(adminEmail);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Mlindosi',
        campus: 'musgrave',
      },
    });

    if (error) throw error;
    user = data.user;
  }

  const { data: currentProfile, error: profileReadError } = await supabase
    .from('users')
    .select('id, role, campus')
    .eq('id', user.id)
    .maybeSingle();

  if (profileReadError) throw profileReadError;

  const { data: admins, error: adminsError } = await supabase
    .from('users')
    .select('id, campus')
    .eq('role', 'admin');

  if (adminsError) throw adminsError;

  const otherAdminCampuses = new Set(
    admins
      .filter((admin) => admin.id !== user.id)
      .map((admin) => admin.campus),
  );

  let campus = currentProfile?.role === 'admin'
    ? currentProfile.campus
    : null;

  if (!campus) {
    campus = ['musgrave', 'umhlanga'].find(
      (candidate) => !otherAdminCampuses.has(candidate),
    );
  }

  if (!campus) {
    throw new Error(
      'Both campuses already have an administrator. Remove or demote an existing admin first.',
    );
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name: 'Mlindosi',
      campus,
      role: 'admin',
    })
    .eq('id', user.id);

  if (updateError) throw updateError;

  console.log(`Admin ready: ${adminEmail}, campus: ${campus}`);
  return user;
}

async function ensureActiveRound(adminId) {
  const { data: existing, error: readError } = await supabase
    .from('suggestion_rounds')
    .select('id, name')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('suggestion_rounds')
    .insert({
      name: 'Portfolio Community Round',
      active: true,
      created_by: adminId,
    })
    .select('id, name')
    .single();

  if (error) throw error;
  return data;
}

function generatePassword() {
  return `Sample9aA!${randomBytes(18).toString('base64url')}`;
}

async function ensureSampleStudent(number, campus) {
  const suffix = String(number).padStart(2, '0');
  const email = `sample.student${suffix}@example.com`;
  const fullName = `Sample Student ${suffix}`;

  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: generatePassword(),
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        campus,
      },
    });

    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      campus,
      role: 'student',
    })
    .eq('id', user.id);

  if (profileError) throw profileError;

  return {
    id: user.id,
    email,
    fullName,
    campus,
  };
}

async function addSuggestion(student, suggestion, roundId) {
  const { data: existing, error: readError } = await supabase
    .from('suggestions')
    .select('id')
    .eq('submitted_by', student.id)
    .eq('round_id', roundId)
    .limit(1)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    console.log(`Suggestion already exists for ${student.email}`);
    return;
  }

  const { error } = await supabase.from('suggestions').insert({
    text: suggestion.text,
    campus: suggestion.campus,
    cluster_label: suggestion.clusterLabel,
    status: suggestion.status,
    submitted_by: student.id,
    round_id: roundId,
    anonymous: true,
    category: suggestion.category,
  });

  if (error) throw error;

  console.log(`Added suggestion for ${student.email}`);
}

async function main() {
  const admin = await ensureAdmin();
  const round = await ensureActiveRound(admin.id);

  for (let index = 0; index < suggestions.length; index += 1) {
    const suggestion = suggestions[index];
    const student = await ensureSampleStudent(
      index + 1,
      suggestion.campus,
    );

    await addSuggestion(student, suggestion, round.id);
  }

  console.log('Seed completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
