# Nutanix ↔ VMware Translation Reference

Generated At: 2026-05-12T13:52:28.183Z

---

## ADS (Acropolis Dynamic Scheduling)
- Nutanix: ADS (Acropolis Dynamic Scheduling)
- VMware: DRS (Distributed Resource Scheduler)
- Mapping Type: partial
- Definition:
  - ADS automatically balances VM workloads across hosts. DRS dynamically optimizes VM placement based on resource consumption.
- Explanation:
  - Both technologies help maintain balanced cluster utilization and workload performance.
- Lifecycle State: approved
- Source: @ntnx-translation.md (117-121)

---

## AHV (Acropolis Hypervisor)
- Nutanix: AHV (Acropolis Hypervisor)
- VMware: ESXi
- Mapping Type: closest
- Definition:
  - AHV is Nutanix’s enterprise hypervisor built on KVM. ESXi is VMware’s enterprise bare-metal hypervisor.
- Explanation:
  - Both run virtual machines directly on physical hardware as Type-1 hypervisors. AHV is bundled with Nutanix AOS licensing while ESXi is licensed separately in VMware environments.
- Lifecycle State: approved
- Source: @ntnx-translation.md (54-59)

---

## Calm
- Nutanix: Calm
- VMware: Aria Automation / vRealize Automation
- Mapping Type: partial
- Definition:
  - Calm automates application deployment, orchestration, and lifecycle management. Aria Automation provides infrastructure and application automation workflows.
- Explanation:
  - Both support self-service provisioning and automation blueprints.
- Lifecycle State: approved
- Source: @ntnx-translation.md (336-340)

---

## Category
- Nutanix: Category
- VMware: Tag
- Mapping Type: partial
- Definition:
  - Nutanix Categories are metadata key:value pairs used to organize workloads, automate operations, and apply policies such as security, DR, and automation workflows. VMware Tags are metadata labels attached to objects like VMs, datastores, and hosts for organization and policy grouping.
- Explanation:
  - Both technologies provide logical grouping and automation targeting capabilities. Nutanix Categories are more tightly integrated into policy-driven automation workflows within Prism Central.
- Lifecycle State: approved
- Source: @ntnx-translation.md (13-18)

---

## Cluster
- Nutanix: Cluster
- VMware: vSphere Cluster
- Mapping Type: closest
- Definition:
  - A logical grouping of hosts that share compute, storage, and networking resources.
- Explanation:
  - Clusters enable workload mobility, HA, and resource balancing.
- Lifecycle State: approved
- Source: @ntnx-translation.md (80-83)

---

## CVM (Controller VM)
- Nutanix: CVM (Controller VM)
- VMware: vSAN Storage Controller Concept
- Mapping Type: closest
- Definition:
  - A Nutanix Controller VM is a dedicated VM running on every node that provides distributed storage and cluster services.
- Explanation:
  - VMware does not have a direct equivalent. CVMs are fundamental to Nutanix’s distributed storage architecture and handle I/O orchestration, replication, and storage optimization.
- Lifecycle State: approved
- Source: @ntnx-translation.md (104-108)

---

## Distributed Storage Fabric (DSF)
- Nutanix: Distributed Storage Fabric (DSF)
- VMware: vSAN
- Mapping Type: partial
- Definition:
  - DSF aggregates local disks into a distributed shared storage platform. vSAN pools local storage into a shared datastore.
- Explanation:
  - Both platforms provide software-defined storage with resiliency and distributed data services.
- Lifecycle State: approved
- Source: @ntnx-translation.md (182-186)

---

## Erasure Coding
- Nutanix: Erasure Coding
- VMware: RAID-5/6 Erasure Coding
- Mapping Type: partial
- Definition:
  - Erasure coding provides storage efficiency while maintaining resiliency through parity calculations.
- Explanation:
  - Both platforms reduce storage overhead compared to full replication models.
- Lifecycle State: approved
- Source: @ntnx-translation.md (268-271)

---

## Flow Network Security
- Nutanix: Flow Network Security
- VMware: NSX Distributed Firewall
- Mapping Type: partial
- Definition:
  - Nutanix Flow provides microsegmentation and VM-level security controls. VMware NSX provides software-defined networking and distributed firewall capabilities.
- Explanation:
  - Both technologies enforce east-west traffic security policies inside the data center.
- Lifecycle State: approved
- Source: @ntnx-translation.md (282-286)

---

## HA
- Nutanix: HA
- VMware: VMware HA
- Mapping Type: partial
- Definition:
  - HA automatically restarts workloads when host failures occur.
- Explanation:
  - Both platforms provide VM failover and resiliency capabilities to minimize downtime.
- Lifecycle State: approved
- Source: @ntnx-translation.md (130-133)

---

## Host
- Nutanix: Host
- VMware: ESXi Host
- Mapping Type: closest
- Definition:
  - A physical server contributing compute and storage resources to a virtualization cluster.
- Explanation:
  - Hosts provide CPU, memory, local disks, and networking resources for VMs.
- Lifecycle State: approved
- Source: @ntnx-translation.md (92-95)

---

## Live Migration
- Nutanix: Live Migration
- VMware: vMotion
- Mapping Type: partial
- Definition:
  - Live migration moves running VMs between hosts with minimum downtime.
- Explanation:
  - Enables maintenance operations and workload balancing without application interruption.
- Lifecycle State: approved
- Source: @ntnx-translation.md (142-145)

---

## Nutanix Disaster Recovery / Leap
- Nutanix: Nutanix Disaster Recovery / Leap
- VMware: Site Recovery Manager (SRM)
- Mapping Type: partial
- Definition:
  - Nutanix DR automates replication, failover, and recovery orchestration. VMware SRM automates disaster recovery workflows and failover operations.
- Explanation:
  - Both platforms provide orchestration for business continuity and site recovery.
- Lifecycle State: approved
- Source: @ntnx-translation.md (309-313)

---

## Nutanix Files
- Nutanix: Nutanix Files
- VMware: VMware File Services
- Mapping Type: partial
- Definition:
  - Nutanix Files delivers SMB and NFS file services. VMware File Services provides integrated file-sharing capabilities on vSAN.
- Explanation:
  - Both enable enterprise file sharing and NAS-style services.
- Lifecycle State: approved
- Source: @ntnx-translation.md (231-235)

---

## Nutanix Kubernetes Platform (NKP)
- Nutanix: Nutanix Kubernetes Platform (NKP)
- VMware: Tanzu Kubernetes Grid (TKG)
- Mapping Type: partial
- Definition:
  - Enterprise Kubernetes management platforms for deploying and operating containerized workloads.
- Explanation:
  - Both simplify Kubernetes lifecycle management across hybrid environments.
- Lifecycle State: approved
- Source: @ntnx-translation.md (376-379)

---

## Nutanix Move
- Nutanix: Nutanix Move
- VMware: HCX / VMware Converter
- Mapping Type: partial
- Definition:
  - Nutanix Move migrates workloads into Nutanix environments with minimal downtime. VMware HCX and Converter support workload mobility and migration operations.
- Explanation:
  - These tools simplify infrastructure modernization and platform transitions.
- Lifecycle State: approved
- Source: @ntnx-translation.md (390-394)

---

## Nutanix Objects
- Nutanix: Nutanix Objects
- VMware: S3-Compatible Object Storage
- Mapping Type: closest
- Definition:
  - Nutanix Objects provides scalable S3-compatible object storage services.
- Explanation:
  - VMware environments typically integrate external S3-compatible object platforms rather than providing native equivalents.
- Lifecycle State: approved
- Source: @ntnx-translation.md (244-247)

---

## Nutanix Volumes
- Nutanix: Nutanix Volumes
- VMware: iSCSI Datastore / Block Storage
- Mapping Type: closest
- Definition:
  - Nutanix Volumes provides scalable block storage services to applications and external workloads.
- Explanation:
  - Comparable to VMware block-storage-based datastore consumption models.
- Lifecycle State: approved
- Source: @ntnx-translation.md (219-222)

---

## Open vSwitch
- Nutanix: Open vSwitch
- VMware: vSwitch / vDS
- Mapping Type: partial
- Definition:
  - Virtual switches provide software-defined networking connectivity between VMs and physical networks.
- Explanation:
  - Open vSwitch in AHV serves a role similar to VMware standard and distributed virtual switches.
- Lifecycle State: approved
- Source: @ntnx-translation.md (295-298)

---

## Prism Central
- Nutanix: Prism Central
- VMware: vCenter Server
- Mapping Type: partial
- Definition:
  - Prism Central is Nutanix’s centralized management plane for multiple clusters, automation, analytics, governance, and operations. vCenter Server is VMware’s centralized management platform for vSphere environments.
- Explanation:
  - Both provide centralized inventory management, monitoring, lifecycle operations, and policy administration across clusters. Prism Central additionally integrates native Nutanix services such as Flow, Calm, and X-Play.
- Lifecycle State: approved
- Source: @ntnx-translation.md (27-32)

---

## Prism Element
- Nutanix: Prism Element
- VMware: ESXi Host / Cluster Management
- Mapping Type: closest
- Definition:
  - Prism Element manages an individual Nutanix cluster and provides operational visibility into compute, storage, and VM resources. VMware cluster management is generally handled through vCenter and ESXi host interfaces.
- Explanation:
  - Prism Element is more cluster-centric, while VMware distributes management responsibilities between ESXi and vCenter.
- Lifecycle State: approved
- Source: @ntnx-translation.md (41-45)

---

## Prism Pro / Intelligent Operations
- Nutanix: Prism Pro / Intelligent Operations
- VMware: Aria Operations / vRealize Operations
- Mapping Type: partial
- Definition:
  - Analytics and monitoring platforms for infrastructure health, capacity, and optimization.
- Explanation:
  - Both provide operational intelligence and proactive infrastructure recommendations.
- Lifecycle State: approved
- Source: @ntnx-translation.md (362-365)

---

## Protection Policy
- Nutanix: Protection Policy
- VMware: VM Protection Policy
- Mapping Type: partial
- Definition:
  - Policies defining backup schedules, replication, and retention behavior for workloads.
- Explanation:
  - Used to automate resiliency and recovery requirements.
- Lifecycle State: approved
- Source: @ntnx-translation.md (322-325)

---

## Replication Factor (RF2/RF3)
- Nutanix: Replication Factor (RF2/RF3)
- VMware: FTT (Failures To Tolerate)
- Mapping Type: partial
- Definition:
  - Replication policies determine how many copies of data are maintained for resiliency.
- Explanation:
  - Both technologies protect against node or disk failures by maintaining redundant data copies.
- Lifecycle State: approved
- Source: @ntnx-translation.md (256-259)

---

## Storage Container
- Nutanix: Storage Container
- VMware: Datastore
- Mapping Type: partial
- Definition:
  - Nutanix Storage Containers logically organize storage capacity and define storage efficiency policies. VMware Datastores provide logical storage presentation to hypervisors and VMs.
- Explanation:
  - Nutanix containers additionally control features such as compression, deduplication, and replication policies.
- Lifecycle State: approved
- Source: @ntnx-translation.md (156-160)

---

## Storage Pool
- Nutanix: Storage Pool
- VMware: Disk Group / Storage Pool
- Mapping Type: partial
- Definition:
  - A storage pool aggregates physical disks into a consumable storage resource layer.
- Explanation:
  - Storage pools provide the foundational capacity layer for containers and datastores.
- Lifecycle State: approved
- Source: @ntnx-translation.md (195-198)

---

## vDisk
- Nutanix: vDisk
- VMware: VMDK
- Mapping Type: partial
- Definition:
  - A virtual disk is the storage abstraction attached to a VM.
- Explanation:
  - Nutanix vDisks and VMware VMDKs both store VM operating systems and application data.
- Lifecycle State: approved
- Source: @ntnx-translation.md (207-210)

---

## VM
- Nutanix: VM
- VMware: Virtual Machine
- Mapping Type: closest
- Definition:
  - A software-defined compute instance running guest operating systems and applications.
- Explanation:
  - The VM abstraction is functionally similar across Nutanix AHV and VMware ESXi environments.
- Lifecycle State: approved
- Source: @ntnx-translation.md (68-71)

---

## Volume Group
- Nutanix: Volume Group
- VMware: RDM / vVol Concept
- Mapping Type: closest
- Definition:
  - Nutanix Volume Groups provide block storage access to workloads. VMware RDMs and vVols provide direct or granular storage presentation.
- Explanation:
  - These technologies support applications requiring specialized block storage configurations.
- Lifecycle State: approved
- Source: @ntnx-translation.md (169-173)

---

## X-Play
- Nutanix: X-Play
- VMware: Aria Orchestrator / vRealize Orchestrator
- Mapping Type: partial
- Definition:
  - X-Play provides event-driven automation and remediation workflows. VMware Orchestrator automates operational and infrastructure tasks.
- Explanation:
  - Both platforms reduce manual operational overhead through workflow automation.
- Lifecycle State: approved
- Source: @ntnx-translation.md (349-353)

