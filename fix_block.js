import fs from 'fs';
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<Save className="h-3\.5 w-3\.5" \/>\s*Enregistrer le Logo\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
code = code.replace(regex, `                        <Save className="h-3.5 w-3.5" />
                        Enregistrer le Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
