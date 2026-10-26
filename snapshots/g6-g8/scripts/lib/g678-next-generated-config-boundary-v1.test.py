import importlib.util,json,pathlib,unittest
p=pathlib.Path(__file__).with_name('g678-next-generated-config-boundary-v1.py');spec=importlib.util.spec_from_file_location('boundary',p);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
DIST='.next-alg-p001-production-scan'
class Boundary(unittest.TestCase):
 def test_actual_local_qa_baseline_and_exact_two_imports(self):
  root=p.parents[2];before=(root/'output/alg-l06-p028-production-v2/config-backup-v1-next-env.d.ts').read_bytes();after=before.replace(b'./.next-alg-p001-local-qa/dev/types/',b'./.next-alg-p001-production-scan/types/');self.assertTrue(b.verified_generated_config('next-env.d.ts',before,after,DIST))
  for invalid in [after+b'// extra\n',after.replace(b'root-params',b'unknown'),after.replace(b'production-scan',b'another')]:
   with self.assertRaises(AssertionError):b.verified_generated_config('next-env.d.ts',before,invalid,DIST)
 def test_default_baseline_is_still_supported_and_unknown_tree_rejected(self):
  before=b'import "./.next/dev/types/routes.d.ts";\nimport "./.next/dev/types/root-params.d.ts";\n';self.assertTrue(b.verified_generated_config('next-env.d.ts',before,before.replace(b'./.next/dev/types/',b'./.next-alg-p001-production-scan/types/'),DIST))
  unknown=before.replace(b'.next/dev',b'.another/dev')
  with self.assertRaises(AssertionError):b.verified_generated_config('next-env.d.ts',unknown,unknown.replace(b'.another/dev',b'.next-alg-p001-production-scan'),DIST)
 def test_exact_typescript_includes_only(self):
  source={'include':['src/**/*.ts'],'compilerOptions':{'strict':True}};generated={**source,'include':source['include']+[DIST+'/types/**/*.ts',DIST+'/dev/types/**/*.ts']};self.assertTrue(b.verified_generated_config('tsconfig.json',json.dumps(source).encode(),json.dumps(generated).encode(),DIST));generated['compilerOptions']={'strict':False}
  with self.assertRaises(AssertionError):b.verified_generated_config('tsconfig.json',json.dumps(source).encode(),json.dumps(generated).encode(),DIST)
if __name__=='__main__':unittest.main()
