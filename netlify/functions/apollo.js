exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const APOLLO_KEY = 'ptWWyMNsMN88dd6NkB-EUw';

  try {
    const { company, jobTitle } = JSON.parse(event.body);

    if (!company || !jobTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Company and jobTitle are required' })
      };
    }

    const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_KEY
      },
      body: JSON.stringify({
        api_key: APOLLO_KEY,
        page: 1,
        per_page: 10,
        person_titles: [jobTitle],
        q_organization_name: company
      })
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      return {
        statusCode: apolloRes.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Apollo error: ' + errText })
      };
    }

    const data = await apolloRes.json();
    const people = (data.people || []).map(p => ({
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      title: p.title || jobTitle,
      company: p.organization?.name || company,
      email: p.email || null,
      linkedin: p.linkedin_url || null,
      location: p.city ? `${p.city}${p.country ? ', ' + p.country : ''}` : (p.country || null)
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ people })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal server error' })
    };
  }
};
