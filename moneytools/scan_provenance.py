"""Record the actual invocation, without inferring it from a planned schedule."""
import re

def scan_provenance(environ, started_at):
    event = environ.get('GITHUB_EVENT_NAME', '')
    trigger = {'schedule': 'scheduled', 'workflow_dispatch': 'manual', 'push': 'code_push'}.get(event, 'unknown')
    # Only a GitHub Actions invocation can claim a workflow trigger.
    trusted = environ.get('GITHUB_ACTIONS') == 'true' and environ.get('GITHUB_REPOSITORY') == 'virus11456/moneytools'
    if not trusted:
        trigger = 'unknown'
    result = {'trigger': trigger, 'startedAt': started_at}
    run_id = environ.get('GITHUB_RUN_ID', '')
    attempt = environ.get('GITHUB_RUN_ATTEMPT', '')
    if trusted and re.fullmatch(r'[1-9][0-9]{0,19}', run_id):
        result['runId'] = run_id
        if re.fullmatch(r'[1-9][0-9]{0,19}', attempt):
            result['runAttempt'] = attempt
    return result
