import Icon from '@/components/Icon'

const requireAll = requireContext => requireContext.keys().map(requireContext)
const req = require.context('@/assets/icon/', true, /\.svg$/)
requireAll(req)

export default Icon
