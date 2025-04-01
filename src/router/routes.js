
const routes = []

if ( process.env.MODE === 'electron' ) {
  routes.push(
    {
      path: '/',
      component: () => import( 'layouts/desktop/MainLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/desktop/PasswordNote.vue' )
        },
        {
          path: '/notes',
          component: () => import( 'pages/desktop/NormalNote.vue' )
        },
        {
          path: '/shared',
          component: () => import( 'pages/desktop/Shared.vue' )
        },
        {
          path: '/labels',
          component: () => import( 'pages/desktop/Labels.vue' )
        },
        {
          path: '/charge',
          component: () => import( 'pages/desktop/Charge.vue' )
        },
        {
          path: '/settings',
          component: () => import( 'pages/desktop/Settings/Index.vue' )
        },
        {
          path: '/history',
          component: () => import( 'pages/desktop/History.vue' )
        },
        {
          path: '/deleted',
          component: () => import( 'pages/desktop/DeletedRecords.vue' )
        },
        {
          path: '/help',
          component: () => import( 'pages/desktop/Help.vue' )
        },
        {
          path: '/settings/backup',
          component: () => import( 'pages/desktop/Settings/Backup.vue' )
        },
        {
          path: '/settings/change_password',
          component: () => import( 'pages/desktop/Settings/ChangePassword.vue' )
        },
        {
          path: '/settings/remove_account',
          component: () => import( 'pages/desktop/Settings/RemoveAccount.vue' )
        },
        {
          path: '/alias',
          component: () => import( 'pages/desktop/Alias.vue' )
        }
      ]
    },
    {
      path: '/locking',
      component: () => import( 'layouts/desktop/LoginLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/desktop/Locking.vue' )
        }
      ]
    },
    {
      path: '/account',
      component: () => import( 'layouts/desktop/AccountLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/desktop/Account.vue' )
        }
      ]
    }
  )
}

if ( process.env.MODE === 'capacitor' ) {
  routes.push(
    {
      path: '/',
      component: () => import( 'layouts/mobile/MainLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/mobile/PasswordNote.vue' )
        },
        {
          path: '/notes',
          component: () => import( 'pages/mobile/NormalNote.vue' )
        },
        {
          path: '/shared',
          component: () => import( 'pages/mobile/Shared.vue' )
        },
        {
          path: '/labels',
          component: () => import( 'pages/mobile/Labels.vue' )
        }
      ]
    },
    {
      path: '/detail',
      component: () => import( 'layouts/mobile/ChildrenLayout.vue' ),
      children: [
        {
          path: '/charge',
          component: () => import( 'pages/mobile/Charge.vue' )
        },
        {
          path: '/show_password_note/:id',
          name: 'show_password_note',
          component: () => import( 'pages/mobile/ShowPasswordNote.vue' )
        },
        {
          path: '/show_normal_note/:id',
          name: 'show_normal_note',
          component: () => import( 'pages/mobile/ShowNormalNote.vue' )
        },
        {
          path: '/show_histories',
          name: 'show_histories',
          component: () => import( 'pages/mobile/Histories.vue' )
        },
        {
          path: '/settings',
          component: () => import( 'pages/mobile/Settings/Index.vue' )
        },
        {
          path: '/help',
          component: () => import( 'pages/mobile/Help.vue' )
        },
        {
          path: '/history',
          component: () => import( 'pages/mobile/History.vue' )
        },
        {
          path: '/deleted',
          component: () => import( 'pages/mobile/DeletedRecords.vue' )
        },
        {
          path: '/settings/backup',
          component: () => import( 'pages/mobile/Settings/Backup.vue' )
        },
        {
          path: '/settings/change_password',
          component: () => import( 'pages/mobile/Settings/ChangePassword.vue' )
        },
        {
          path: '/settings/remove_account',
          component: () => import( 'pages/mobile/Settings/RemoveAccount.vue' )
        },
        {
          path: '/alias',
          component: () => import( 'pages/mobile/Alias.vue' )
        },
        {
          path: '/qrreader',
          component: () => import( 'pages/mobile/QRReader.vue' )
        }

      ]
    },
    {
      path: '/locking',
      component: () => import( 'layouts/mobile/LoginLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/mobile/Locking.vue' )
        }
      ]
    },
    {
      path: '/account',
      component: () => import( 'layouts/mobile/AccountLayout.vue' ),
      children: [
        {
          path: '',
          component: () => import( 'pages/mobile/Account.vue' )
        }
      ]
    },
    {
      // 下面的编辑和新增笔记页面不能滑动左侧返回
      path: '/noswipe',
      component: () => import( 'layouts/mobile/ChildrenLayoutNoSwipe.vue' ),
      children: [
        {
          path: '/edit_password_note/:id',
          name: 'edit_password_note',
          component: () => import( 'pages/mobile/EditPasswordNote.vue' )
        },
        {
          path: '/add_password_note',
          name: 'add_password_note',
          component: () => import( 'pages/mobile/AddPasswordNote.vue' )
        },
        {
          path: '/edit_normal_note/:id',
          name: 'edit_normal_note',
          component: () => import( 'pages/mobile/EditNormalNote.vue' )
        },
        {
          path: '/add_normal_note',
          name: 'add_normal_note',
          component: () => import( 'pages/mobile/AddNormalNote.vue' )
        }

      ]
    }

  )
}

// Always leave this as last one
routes.push({
  path: '*',
  component: () => import('pages/Error404.vue')
})

export default routes
