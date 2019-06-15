
import store from '../index'
import * as types from '../action-types'

import { generate } from 'shortid'
import Xterm from '../../js/terminal'

const fs = window.require('fs')
const path = window.require('path')

/**
 * 一个项目的数据模板
 * @param {String} name name of project
 * @param {Array} actions scripts in package.json
 * @param {Array} xterms Array of instances of xterm
 * @param {String} cwd root path of the project, as well as, default path of teminal
 * @param {String} activeXtermId id of the active terminal
 */
const projectModel = (name, actions, xterms, cwd, activeXtermId, id) => ({
  id: id || generate(),
  name,
  isNameEdit: false,
  actions,
  xterms,
  cwd,
  activeXtermId
})

const xtermModel = (id, cwd) => {

  const xterm = new Xterm({ cwd })

  return {
    id,
    cwd,
    xterm
  }
}

export const initProject = (project, data) => {

  var data = data || fs.readFileSync(path.join(project.cwd, 'package.json'), 'utf8')
  
  const scripts = JSON.parse(data).scripts

  const actions = Object.keys(scripts).map(key => ({
    id: generate(),
    label: key,
    script: scripts[key]
  }))

  const id = generate()
  const xterms = [
    xtermModel(id, project.cwd)
  ]

  const _project = projectModel(project.name, actions, xterms, project.cwd, id, project.id)

  const projects = store.getState().project.projects
  const _projects = [ ...projects ]
  const idx = projects.findIndex(p => p.id === project.id)
  _projects.splice(idx, 1, _project)

  return {
    type: types.initProject,
    projects: _projects,
    activeId: project.id,
    activeXterm: xterms[0]
  }
}

export const asyncLoad = project => {

  return dispatch => {

    fs.readFile(path.join(project.cwd, 'package.json'), 'utf8', (err, data) => {
  
      dispatch(initProject(project, data))
    })
  }
}

export const addProject = (jsonFile) => {

  const name = `项目${store.getState().project.projects.length + 1}`
  
  const { dir: cwd } = path.parse(jsonFile)
  const data = fs.readFileSync(jsonFile, 'utf8')
  // scripts of 'package.json' file
  const scripts = JSON.parse(data).scripts
  const actions = Object.keys(scripts).map(key => ({
    id: generate(),
    label: key,
    script: scripts[key]
  }))

  // list of instances of xterm
  const id = generate()
  
  const xterms = [
    xtermModel(id, cwd)
  ]

  const project = projectModel(name, actions, xterms, cwd, id)

  return {
    type: types.addProject,
    project
  }
}

export const switchProject = (project) => {

  const activeXterm = project.xterms.find(x => x.id === project.activeXtermId)

  return {
    type: types.switchProject,
    activeId: project.id,
    activeXterm
  }
}

export const delProject = (id) => {

  const _projects = [ ...store.getState().project.projects ]
  const idx = _projects.findIndex(p => p.id === id)
  _projects.splice(idx, 1)

  return {
    type: types.delProject,
    projects: _projects
  }
}

export const addXterm = () => {

  const {
    projects,
    activeId
  } = store.getState().project

  const idx = projects.findIndex(p => p.id === activeId)
  // const target = projects.find(p => p.id === activeId)
  const id = generate()
  const xterm = xtermModel(id, projects[idx].cwd)

  const _projects = [ ...projects ]
  _projects[idx].xterms.push(xterm)
  _projects[idx].activeXtermId = id

  return {
    type: types.addXterm,
    projects: _projects,
    xterm
  }
}

export const switchXterm = (id) => {

  const {
    projects,
    activeId
  } = store.getState().project

  const p = projects.find(p => p.id === activeId)
  const xtermModel = p.xterms.find(x => x.id === id)
  // 记录当前project启用中的xterm，方便切换project时恢复
  p.activeXtermId = id

  return {
    type: types.switchXterm,
    xtermModel
  }
}

export const delXterm = id => {

  const _projects = [ ...store.getState().project.projects ]
  const activeId = store.getState().project.activeId

  const p = _projects.find(p => p.id === activeId)
  const idx = p.xterms.findIndex(x => x.id === id)
  // 记录当前project启用中的xterm，方便切换project时恢复
  p.activeXtermId = undefined
  p.xterms.splice(idx, 1)

  return {
    type: types.delXterm,
    projects: _projects
  }
}

export const rename = (pid, name) => {

  const {
    projects
  } = store.getState().project

  const idx = projects.findIndex(p => p.id === pid)

  const _projects = [ ...projects ]

  _projects[idx].name = name || _projects[idx].name
  _projects[idx].isNameEdit = false

  return {
    type: 'rename',
    projects: _projects
  }
}

export const enableEdit = (pid) => {

  const {
    projects
  } = store.getState().project

  const idx = projects.findIndex(p => p.id === pid)

  const _projects = [ ...projects ]

  _projects[idx].isNameEdit = true

  return {
    type: 'enableEdit',
    projects: _projects
  }

}