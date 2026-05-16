type DeveloperMember = {
  role: "مطور الموقع"
  name: string
  github: string
  x: string
}

type DesignerMember = {
  role: "تصميم الهوية"
  name: string
  linkedin: string
  x: string
}

type ManagerMember = {
  role: "أدارة وأشراف"
  name: string
  github: string
  linkedin: string
  x: string
}

export const TEAM_MEMBERS: (DeveloperMember | DesignerMember | ManagerMember)[] = [
  {
    role: "أدارة وأشراف",
    name: "عزام الخضيري",
    github: "https://github.com/azampro",
    linkedin: "https://www.linkedin.com/in/azam-alkhodiriy/",
    x: "https://x.com/azampro_",
  },
  {
    role: "مطور الموقع",
    name: "albrrak773",
    github: "https://github.com/albrrak773",
    x: "https://x.com/albrrak773",
  },
  {
    role: "تصميم الهوية",
    name: "أمل الرحيمي",
    linkedin: "https://linkedin.com/in/",
    x: "https://x.com/",
  },
]
