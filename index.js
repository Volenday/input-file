const core = require('@actions/core');
const github = require('@actions/github');

const runAction = async () => {
	try {
		const token = core.getInput('githubToken');

		const octokit = new github.GitHub(token);
		const graphqlWithAuth = octokit.graphql.defaults({
			headers: {
				authorization: `token ${token}`
			}
		});

		const repoIdQuery = `query getRepoId($owner: String!, $repo: String!) {
			repository(owner: $owner, name: $repo) {
				id,
				ref(qualifiedName: "master") {
					name
					prefix
					target {
						oid
					}
				}
				parent {
					ref(qualifiedName: "master") {
						name
						prefix
						target {
							oid
						}
					}
				}
			}
		}`;

		const repoIdVariables = {
			owner: 'gjvpaet',
			repo: 'input-file'
		};

		const repo = await graphqlWithAuth(repoIdQuery, repoIdVariables);
		console.log('repo: ', repo.repository.ref.target);
		console.log(repo.repository.parent);
		console.log(repo.repository.parent.ref.target);

		const createPullRequest = `
			mutation createPullRequest($base: String!, $head: String!, $title: String!, $repositoryId: String!) {
				createPullRequest(input: {baseRefName: $base, headRefName: $head, title: $title, repositoryId: $repositoryId, }) {
					clientMutationId
					pullRequest {
						id
						title
						number
					}
				}
			}
		`;

		const createPullRequestVars = {
			base: 'master',
			head: 'gjvpaet:master',
			title: 'Sample Pull Request',
			repositoryId: repo.repository.id
			// baseSha: repo.repository.parent.ref.target,
			// headSha: repo.repository.ref.target
		};

		const test = await graphqlWithAuth(createPullRequest, createPullRequestVars);
		console.log('test: ', test);
	} catch (error) {
		console.log('error: ', error);
	}
};

runAction();
